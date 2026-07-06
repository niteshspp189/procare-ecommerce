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
    return false // keeping the fixed rate of 80rs, no dynamic calculation needed
  }

  async calculatePrice(optionData: any, data: any, context: any): Promise<CalculatedShippingOptionPrice> {
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
        isCOD = fullOrder.payment_collections?.[0]?.payments?.[0]?.provider_id === "manual" ||
                order?.payment_collections?.[0]?.payments?.[0]?.provider_id === "manual"
      } catch (err: any) {
        console.warn("[ShiprocketService] Failed to retrieve full order details via orderModuleService, trying pgConnection fallback:", err.message)
        
        // pgConnection Fallback query
        try {
          const pgConnection = this.container.pgConnection || this.container.pg_connection
          if (pgConnection) {
            console.log("[ShiprocketService] Attempting raw SQL fallback via pgConnection...")
            let orderRow: any = null
            if (typeof pgConnection.query === 'function') {
              const res = await pgConnection.query('SELECT display_id, email, shipping_address_id FROM "order" WHERE id = $1', [order.id])
              orderRow = res?.rows?.[0]
              if (orderRow?.shipping_address_id) {
                const addrRes = await pgConnection.query('SELECT phone FROM "order_address" WHERE id = $1', [orderRow.shipping_address_id])
                phoneVal = addrRes?.rows?.[0]?.phone || phoneVal
              }
              const paymentRes = await pgConnection.query('SELECT provider_id FROM "payment" WHERE order_id = $1 LIMIT 1', [order.id])
              isCOD = paymentRes?.rows?.[0]?.provider_id === 'manual'
            } else if (typeof pgConnection.raw === 'function') {
              const res = await pgConnection.raw('SELECT display_id, email, shipping_address_id FROM "order" WHERE id = ?', [order.id])
              orderRow = res?.rows?.[0] || res?.[0]
              if (orderRow?.shipping_address_id) {
                const addrRes = await pgConnection.raw('SELECT phone FROM "order_address" WHERE id = ?', [order.id])
                phoneVal = (addrRes?.rows?.[0]?.phone || addrRes?.[0]?.phone) || phoneVal
              }
              const paymentRes = await pgConnection.raw('SELECT provider_id FROM "payment" WHERE order_id = ? LIMIT 1', [order.id])
              const row = paymentRes?.rows?.[0] || paymentRes?.[0]
              isCOD = row?.provider_id === 'manual'
            }
            
            if (orderRow) {
              displayId = orderRow.display_id
              email = orderRow.email
              console.log("[ShiprocketService] Successfully retrieved details via pgConnection:", { displayId, email, phoneVal, isCOD })
            }
          }
        } catch (dbErr: any) {
          console.error("[ShiprocketService] pgConnection fallback query failed:", dbErr.message)
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
    const cleanPhone = rawPhone.replace(/\D/g, "")
    const phone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : "8588834954"
    
    const emailVal = email || fullOrder?.email || order?.email || "customer@example.com"

    let subTotal = 0
    let totalTax = 0

    const orderItems = items.map(item => {
      const orderItem = fullOrder?.items?.find((oi: any) => 
        oi.sku === item.sku || 
        oi.title === item.title || 
        oi.id === item.line_item_id ||
        oi.item_id === item.line_item_id
      )
      
      const inclusivePrice = orderItem?.unit_price ?? orderItem?.item?.unit_price ?? item.unit_price ?? 0
      const qty = item.quantity || 1
      
      // Calculate 18% inclusive tax
      const taxRate = 18
      const taxablePrice = inclusivePrice / (1 + (taxRate / 100))
      const taxPerUnit = inclusivePrice - taxablePrice
      
      const itemSubtotal = parseFloat((taxablePrice * qty).toFixed(2))
      const itemTax = parseFloat((taxPerUnit * qty).toFixed(2))
      
      subTotal += itemSubtotal
      totalTax += itemTax
      
      return {
        name: item.title || orderItem?.title || orderItem?.item?.title || "Product",
        sku: item.sku || orderItem?.sku || orderItem?.item?.variant_sku || "PRO-SKU",
        units: qty,
        selling_price: parseFloat(taxablePrice.toFixed(2)),
        tax: parseFloat(itemTax.toFixed(2)),
        discount: 0
      }
    })

    const shippingFee = fullOrder?.shipping_total ?? fullOrder?.summary?.shipping_total ?? fullOrder?.shipping_methods?.[0]?.amount ?? 0
    const shippingCharges = parseFloat(shippingFee.toString())

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
      sub_total: parseFloat(subTotal.toFixed(2)),
      tax: parseFloat(totalTax.toFixed(2)),
      grand_total: parseFloat((subTotal + totalTax + shippingCharges).toFixed(2)),
      length: 10,
      breadth: 10,
      height: 10,
      weight: 1 // Default weight 1kg
    }

    try {
      console.log("[ShiprocketService] Pushing order payload to Shiprocket:", JSON.stringify(orderData, null, 2))
      const result = await shiprocketClient.createOrder(orderData)
      console.log("[ShiprocketService] Shiprocket response:", JSON.stringify(result, null, 2))
      
      const externalId = result?.order_id?.toString() || ""
      const awbCode = result?.awb_code || ""
      const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : ""
      
      return {
        data: {
          shiprocket_order_id: externalId,
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
