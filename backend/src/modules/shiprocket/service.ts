import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { CalculatedShippingOptionPrice, CreateFulfillmentResult } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { shiprocketClient } from "./shiprocket-client"

export class ShiprocketFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shiprocket"
  protected container: any

  constructor(container: any) {
    super()
    this.container = container
  }

  async getFulfillmentOptions(): Promise<any[]> {
    return [
      {
        id: "shiprocket-standard",
        name: "Shiprocket Standard"
      }
    ]
  }

  async validateFulfillmentData(optionData: any, data: any, context: any) {
    return data
  }

  async validateOption(data: any): Promise<boolean> {
    return true
  }

  async canCalculate(data: any): Promise<boolean> {
    // Return false so Medusa uses the Flat Rate configured in the Admin panel!
    return false 
  }

  async calculatePrice(optionData: any, data: any, context: any): Promise<CalculatedShippingOptionPrice> {
    // This is only called if the shipping option is mistakenly set to "Calculated" in Admin
    // We return a fallback here, but flat rate should be used.
    return {
      calculated_amount: 80,
      is_calculated_price_tax_inclusive: true
    }
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: any[],
    order: any,
    fulfillment: any
  ): Promise<CreateFulfillmentResult> {
    
    let email = order?.email
    let phoneVal = fulfillment.delivery_address?.phone || order?.shipping_address?.phone
    let displayId = order?.display_id
    let isCOD = false
    let dbItems: any[] = []
    let dbShippingFee = 0

    let fullOrder = order
    if (order && order.id && this.container) {
      try {
        console.log("[ShiprocketService] Attempting to resolve query from container...")
        const query = (typeof this.container?.resolve === "function") 
          ? this.container.resolve("query", { allowUnregistered: true }) 
          : this.container?.query
        if (query) {
          const { data: orders } = await query.graph({
            entity: "order",
            fields: [
              "*",
              "shipping_address.*",
              "billing_address.*",
              "items.*",
              "items.item.*",
              "items.adjustments.*",
              "summary.*",
              "shipping_methods.*",
              "shipping_methods.adjustments.*",
              "payment_collections.*",
              "payment_collections.payments.*",
            ],
            filters: {
              id: [order.id]
            }
          })
          if (orders && orders.length > 0) {
            fullOrder = orders[0]
            console.log("[ShiprocketService] Successfully retrieved full order details via query.graph:", fullOrder.id)
            email = fullOrder.email || email
            phoneVal = fullOrder.shipping_address?.phone || phoneVal
            displayId = fullOrder.display_id || displayId
            const pid1 = fullOrder.payment_collections?.[0]?.payments?.[0]?.provider_id
            const pid2 = order?.payment_collections?.[0]?.payments?.[0]?.provider_id
            isCOD = pid1 === "manual" || pid1 === "pp_system_default" || pid1?.startsWith("pp_system") ||
                    pid2 === "manual" || pid2 === "pp_system_default" || pid2?.startsWith("pp_system")
          }
        }
      } catch (err: any) {
        console.warn("[ShiprocketService] Failed to retrieve full order details via query.graph, trying pgConnection fallback:", err.message)
        
        // pgConnection Fallback query
        try {
          const pgConnection = this.container.__pg_connection__ || 
            (typeof this.container?.resolve === "function" ? this.container.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
            (typeof this.container?.resolve === "function" ? this.container.resolve("pg_connection", { allowUnregistered: true }) : null)
          if (pgConnection) {
            console.log("[ShiprocketService] Attempting raw SQL fallback via pgConnection (__pg_connection__)...")
            
            // Query Order
            try {
              const orderRes = await pgConnection.raw(`
                SELECT o.display_id, o.email, o.shipping_address_id
                FROM "order" o
                WHERE o.id = ?
              `, [order.id])
              const orderRow = orderRes?.rows?.[0]
              
              if (orderRow) {
                displayId = orderRow.display_id
                email = orderRow.email
                
                // Query Address
                if (orderRow.shipping_address_id) {
                  try {
                    const addrRes = await pgConnection.raw('SELECT phone FROM "order_address" WHERE id = ?', [orderRow.shipping_address_id])
                    phoneVal = addrRes?.rows?.[0]?.phone || phoneVal
                  } catch (addrErr: any) {
                    console.error("[ShiprocketService] Failed to query address from DB:", addrErr.message)
                  }
                }
              }
            } catch (orderErr: any) {
              console.error("[ShiprocketService] Failed to query order from DB:", orderErr.message)
            }
            
            // Query Payment
            try {
              const paymentRes = await pgConnection.raw('SELECT p.provider_id FROM "payment" p JOIN "order_payment_collection" opc ON p.payment_collection_id = opc.payment_collection_id WHERE opc.order_id = ? LIMIT 1', [order.id])
              const dbPid = paymentRes?.rows?.[0]?.provider_id
              isCOD = dbPid === 'manual' || dbPid === 'pp_system_default' || (dbPid && dbPid.startsWith('pp_system'))
            } catch (payErr: any) {
              console.warn("[ShiprocketService] Failed to query payment details from DB, trying direct payment table lookup:", payErr.message)
              try {
                const paymentRes = await pgConnection.raw('SELECT provider_id FROM "payment" WHERE order_id = ? LIMIT 1', [order.id])
                const dbPid = paymentRes?.rows?.[0]?.provider_id
                isCOD = dbPid === 'manual' || dbPid === 'pp_system_default' || (dbPid && dbPid.startsWith('pp_system'))
              } catch (payErr2: any) {
                console.warn("[ShiprocketService] Direct payment table lookup failed:", payErr2.message)
              }
            }
            
            // Query Line Items with adjustments
            try {
              const itemsRes = await pgConnection.raw(`
                SELECT oli.title, oli.variant_sku, oli.unit_price, oi.quantity,
                       COALESCE((SELECT SUM(oia.amount * (CASE WHEN oia.is_tax_inclusive THEN 1 ELSE 1.18 END)) FROM "order_line_item_adjustment" oia WHERE oia.item_id = oi.item_id), 0) as discount_total
                FROM "order_item" oi
                JOIN "order_line_item" oli ON oi.item_id = oli.id
                WHERE oi.order_id = ?
              `, [order.id])
              dbItems = itemsRes?.rows || []
            } catch (itemsErr: any) {
              console.error("[ShiprocketService] Failed to query line items from DB:", itemsErr.message)
            }
            
            // Query Shipping Method
            try {
              const shippingRes = await pgConnection.raw('SELECT asm.amount FROM "order_shipping" os JOIN "order_shipping_method" asm ON os.shipping_method_id = asm.id WHERE os.order_id = ?', [order.id])
              dbShippingFee = parseFloat(shippingRes?.rows?.[0]?.amount?.toString() || "0")
            } catch (shipErr: any) {
              console.error("[ShiprocketService] Failed to query shipping from DB:", shipErr.message)
            }
            
            console.log("[ShiprocketService] Fallback retrieval complete:", { displayId, email, phoneVal, isCOD, dbItemsCount: dbItems.length, dbShippingFee })
          }
        } catch (dbErr: any) {
          console.error("[ShiprocketService] pgConnection fallback wrapper failed:", dbErr.message)
        }
      }
    }
    
    // We assume COD if the payment method was manual (Cash on Delivery)
    const paymentMethod = isCOD ? "COD" : "Prepaid"
    
    const address = fulfillment.delivery_address
    const shippingAddress = fullOrder?.shipping_address || order?.shipping_address || {}
    
    const name = address?.first_name || shippingAddress?.first_name || "Customer"
    const lastName = address?.last_name || shippingAddress?.last_name || ""
    const addressLine1 = address?.address_1 || shippingAddress?.address_1 || "Unknown"
    const city = address?.city || shippingAddress?.city || "Unknown"
    const pin = address?.postal_code || shippingAddress?.postal_code || "000000"
    const state = address?.province || shippingAddress?.province || "Unknown"
    const country = address?.country_code || shippingAddress?.country_code || "IN"
    
    const rawPhone = phoneVal || address?.phone || shippingAddress?.phone || "8588834954"
    let cleanPhone = rawPhone.replace(/\D/g, "")
    
    // Strip leading country code if present
    if (cleanPhone.startsWith("91") && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(2)
    } else if (cleanPhone.startsWith("0") && cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(1)
    }
    
    let phone = cleanPhone
    if (phone.length !== 10) {
      console.warn(`[ShiprocketService] Phone number '${rawPhone}' (cleaned: '${cleanPhone}') is not 10 digits. Falling back to default customer care phone.`)
      phone = "8588834954"
    }
    
    const emailVal = email || fullOrder?.email || order?.email || "customer@example.com"

    let totalTax = 0
    let totalItemDiscountSum = 0

    // Map items from database if available, otherwise fall back to items parameter
    const sourceItems = (fullOrder?.items && fullOrder.items.length > 0) ? fullOrder.items : (dbItems.length > 0 ? dbItems : (items || []))
    const orderItems = sourceItems.map((item: any) => {
      const title = item.title || item.name || item.item?.title || "Product"
      const sku = item.variant_sku || item.sku || item.item?.variant_sku || "PRO-SKU"
      const qty = parseInt(item.quantity?.toString() || "1")
      const inclusivePrice = Math.round(parseFloat((item.unit_price ?? item.selling_price ?? item.item?.unit_price ?? 0).toString()))
      
      let itemDiscountTotal = 0
      if (item.discount_total !== undefined && item.discount_total !== null) {
        itemDiscountTotal = parseFloat(item.discount_total.toString())
      } else if (item.adjustments && Array.isArray(item.adjustments)) {
        itemDiscountTotal = item.adjustments.reduce((sum: number, adj: any) => sum + adj.amount * (adj.is_tax_inclusive ? 1 : 1.18), 0)
      }
      
      const discountPerUnit = qty > 0 ? Math.round(itemDiscountTotal / qty) : 0
      totalItemDiscountSum += (discountPerUnit * qty)

      const discountedPrice = Math.max(0, inclusivePrice - discountPerUnit)
      
      // Calculate 18% inclusive tax on discounted amount
      const taxRate = 18
      const taxablePrice = discountedPrice / (1 + (taxRate / 100))
      const taxPerUnit = discountedPrice - taxablePrice
      
      const itemTax = taxPerUnit * qty
      totalTax += itemTax
      
      return {
        name: title,
        sku: sku,
        units: qty,
        selling_price: inclusivePrice, // Shiprocket expects original selling price
        tax: 18, // Tax percentage rate
        discount: discountPerUnit // Per-unit discount subtracted by Shiprocket
      }
    })

    // Resolve shipping fee: use dbShippingFee first, then fall back to fullOrder or order methods
    const shippingFee = dbShippingFee > 0 ? dbShippingFee :
                        (fullOrder?.shipping_methods?.[0]?.amount ?? 
                         order?.shipping_methods?.[0]?.amount ?? 
                         fullOrder?.shipping_total ?? 
                         0)
    const shippingCharges = Math.round(parseFloat(shippingFee.toString()))

    let shippingDiscount = 0
    if (fullOrder?.shipping_methods?.[0]?.adjustments) {
      shippingDiscount = fullOrder.shipping_methods[0].adjustments.reduce((sum: number, adj: any) => sum + adj.amount * (adj.is_tax_inclusive ? 1 : 1.18), 0)
    }

    const undiscountedItemsTotal = orderItems.reduce((sum: number, it: any) => sum + (it.selling_price * it.units), 0)
    const totalDiscount = Math.round(fullOrder?.discount_total ?? fullOrder?.summary?.discount_total ?? (totalItemDiscountSum + shippingDiscount))
    const rawGrandTotal = fullOrder?.total ?? fullOrder?.summary?.total ?? (undiscountedItemsTotal + shippingCharges - totalDiscount)
    const grandTotal = Math.round(parseFloat(rawGrandTotal.toString()))

    const orderData = {
      order_id: `OD${(displayId || fullOrder?.display_id || order?.display_id || order?.id || '').toString().padStart(8, '0')}`,
      order_date: new Date(fullOrder?.created_at || order?.created_at || Date.now()).toISOString().split('T')[0],
      pickup_location: "Primary",
      billing_customer_name: name,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_city: city,
      billing_pincode: pin,
      billing_state: state,
      billing_country: country,
      billing_email: emailVal,
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMethod,
      shipping_charges: shippingCharges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: totalDiscount,
      sub_total: undiscountedItemsTotal, // Shiprocket sub_total is original selling prices sum
      tax: Math.round(totalTax),
      grand_total: grandTotal, // Shiprocket grand_total = sub_total + shipping_charges - total_discount
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1 // Default weight 1kg
    }

    try {
      console.log("[ShiprocketService] Pushing order payload to Shiprocket:", JSON.stringify(orderData, null, 2))
      const result = await shiprocketClient.createOrder(orderData)
      console.log("[ShiprocketService] Shiprocket response:", JSON.stringify(result, null, 2))
      
      const shipmentId = result?.shipment_id?.toString() || ""
      const externalId = result?.order_id?.toString() || ""
      let awbCode = result?.awb_code || ""
      
      // Auto-assign AWB if a shipment ID was returned but AWB wasn't auto-generated by createOrder
      // Disabled as per user request to keep orders in the 'New' tab in Shiprocket
      /*
      if (shipmentId && !awbCode) {
        try {
          console.log("[ShiprocketService] Auto-assigning AWB for shipment:", shipmentId)
          const awbResult = await shiprocketClient.assignAWB(shipmentId)
          console.log("[ShiprocketService] AWB Assignment result:", JSON.stringify(awbResult, null, 2))
          if (awbResult?.awb_assign_status === 1 && awbResult?.response?.data?.awb_code) {
            awbCode = awbResult.response.data.awb_code
          }
        } catch (awbErr: any) {
          console.warn("[ShiprocketService] Failed to auto-assign AWB:", awbErr.message)
        }
      }
      */
      
      const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : ""
      
      return {
        data: {
          shiprocket_order_id: externalId,
          shiprocket_shipment_id: shipmentId,
          awb_code: awbCode,
          shiprocket_response: result,
        },
        labels: awbCode ? [
          {
            tracking_number: awbCode,
            tracking_url: trackingUrl,
            label_url: trackingUrl
          }
        ] : []
      }
    } catch (e: any) {
      console.error("Failed to push fulfillment to shiprocket:", e.message)
      throw new Error(`Shiprocket Fulfillment Error: ${e.message}`)
    }
  }

  async cancelFulfillment(fulfillment: any): Promise<any> {
    return {}
  }

  async createReturnFulfillment(fulfillment: any): Promise<CreateFulfillmentResult> {
    return { data: {}, labels: [] }
  }
}
