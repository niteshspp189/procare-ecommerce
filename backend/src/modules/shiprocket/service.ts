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
      calculated_amount: 1,
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
        console.log("[ShiprocketService] Attempting to resolve ORDER service from container keys:", Object.keys(this.container || {}))
        const orderModuleService = this.container.order || this.container.orderModuleService
        if (!orderModuleService) {
          throw new Error("ORDER module service not found on injected container.")
        }
        fullOrder = await orderModuleService.retrieveOrder(order.id, {
          relations: ["shipping_address", "items", "billing_address", "shipping_methods", "payment_collections.payments"]
        })
        console.log("[ShiprocketService] Successfully retrieved full order details:", fullOrder.id)
        email = fullOrder.email || email
        phoneVal = fullOrder.shipping_address?.phone || phoneVal
        displayId = fullOrder.display_id || displayId
        const pid1 = fullOrder.payment_collections?.[0]?.payments?.[0]?.provider_id
        const pid2 = order?.payment_collections?.[0]?.payments?.[0]?.provider_id
        isCOD = pid1 === "manual" || pid1 === "pp_system_default" || pid1?.startsWith("pp_system") ||
                pid2 === "manual" || pid2 === "pp_system_default" || pid2?.startsWith("pp_system")
      } catch (err: any) {
        console.warn("[ShiprocketService] Failed to retrieve full order details via orderModuleService, trying pgConnection fallback:", err.message)
        
        // pgConnection Fallback query
        try {
          const pgConnection = this.container.__pg_connection__ || this.container.resolve("__pg_connection__", { allowUnregistered: true })
          if (pgConnection) {
            console.log("[ShiprocketService] Attempting raw SQL fallback via pgConnection (__pg_connection__)...")
            
            // Query Order
            try {
              const orderRes = await pgConnection.raw('SELECT display_id, email, shipping_address_id FROM "order" WHERE id = ?', [order.id])
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
            
            // Query Line Items
            try {
              const itemsRes = await pgConnection.raw('SELECT oli.title, oli.variant_sku, oli.unit_price, oi.quantity FROM "order_item" oi JOIN "order_line_item" oli ON oi.item_id = oli.id WHERE oi.order_id = ?', [order.id])
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

    let subTotal = 0
    let totalTax = 0

    // Map items from database if available, otherwise fall back to items parameter
    const orderItems = (dbItems.length > 0 ? dbItems : items).map(item => {
      const title = item.title || item.name || "Product"
      const sku = item.variant_sku || item.sku || "PRO-SKU"
      const qty = parseInt(item.quantity?.toString() || "1")
      const inclusivePrice = Math.round(parseFloat((item.unit_price || item.selling_price || 0).toString()))
      
      // Calculate 18% inclusive tax using rounded inclusivePrice
      const taxRate = 18
      const taxablePrice = inclusivePrice / (1 + (taxRate / 100))
      const taxPerUnit = inclusivePrice - taxablePrice
      
      const itemSubtotal = taxablePrice * qty
      const itemTax = taxPerUnit * qty
      
      subTotal += itemSubtotal
      totalTax += itemTax
      
      return {
        name: title,
        sku: sku,
        units: qty,
        selling_price: inclusivePrice, // Shiprocket expects inclusive price!
        tax: 18, // Tax percentage rate
        discount: 0
      }
    })

    // Resolve shipping fee: use dbShippingFee first, then fall back to fullOrder or order methods
    const shippingFee = dbShippingFee > 0 ? dbShippingFee :
                        (fullOrder?.shipping_methods?.[0]?.amount ?? 
                         order?.shipping_methods?.[0]?.amount ?? 
                         fullOrder?.shipping_total ?? 
                         0)
    const shippingCharges = Math.round(parseFloat(shippingFee.toString()))

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
      total_discount: 0,
      sub_total: Math.round(subTotal + totalTax), // top level sub_total is inclusive item totals
      tax: Math.round(totalTax),
      grand_total: Math.round(subTotal + totalTax + shippingCharges),
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
