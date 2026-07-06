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
    
    // We assume online payment since COD is disabled.
    const paymentMethod = "Prepaid"
    
    let fullOrder = order
    if (order && order.id && this.container) {
      try {
        const orderModuleService = this.container.resolve(Modules.ORDER)
        fullOrder = await orderModuleService.retrieveOrder(order.id, {
          relations: ["shipping_address", "items", "billing_address", "shipping_methods"]
        })
        console.log("[ShiprocketService] Successfully retrieved full order details:", fullOrder.id)
      } catch (err: any) {
        console.warn("[ShiprocketService] Failed to retrieve full order details, falling back to passed order:", err.message)
      }
    }
    
    const address = fulfillment.delivery_address
    const shippingAddress = fullOrder?.shipping_address || order?.shipping_address || {}
    
    const name = address?.first_name || shippingAddress?.first_name || "Customer"
    const lastName = address?.last_name || shippingAddress?.last_name || ""
    const addressLine1 = address?.address_1 || shippingAddress?.address_1 || "Unknown"
    const city = address?.city || shippingAddress?.city || "Unknown"
    const pin = address?.postal_code || shippingAddress?.postal_code || "000000"
    const state = address?.province || shippingAddress?.province || "Unknown"
    const country = address?.country_code || shippingAddress?.country_code || "IN"
    
    const rawPhone = address?.phone || shippingAddress?.phone || "9876543210"
    const cleanPhone = rawPhone.replace(/\D/g, "")
    const phone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone
    
    const email = fullOrder?.email || order?.email || "customer@example.com"

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
      order_id: `OD${(fullOrder?.display_id || order?.display_id || order?.id || '').toString().padStart(8, '0')}`,
      order_date: new Date(fullOrder?.created_at || Date.now()).toISOString().split('T')[0],
      pickup_location: "Primary",
      billing_customer_name: name,
      billing_last_name: lastName,
      billing_address: addressLine1,
      billing_city: city,
      billing_pincode: pin,
      billing_state: state,
      billing_country: country,
      billing_email: email,
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
      const result = await shiprocketClient.createOrder(orderData)
      
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
