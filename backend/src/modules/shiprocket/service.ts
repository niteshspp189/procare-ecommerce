import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import { CalculatedShippingOptionPrice, CreateFulfillmentResult } from "@medusajs/types"
import { shiprocketClient } from "./shiprocket-client"

export class ShiprocketFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shiprocket"

  constructor() {
    super()
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
    
    const address = fulfillment.delivery_address
    const name = address?.first_name || order?.shipping_address?.first_name || "Customer"
    const lastName = address?.last_name || order?.shipping_address?.last_name || ""
    const addressLine1 = address?.address_1 || order?.shipping_address?.address_1 || "Unknown"
    const city = address?.city || order?.shipping_address?.city || "Unknown"
    const pin = address?.postal_code || order?.shipping_address?.postal_code || "000000"
    const state = address?.province || order?.shipping_address?.province || "Unknown"
    const country = address?.country_code || order?.shipping_address?.country_code || "IN"
    const phone = address?.phone || order?.shipping_address?.phone || "9876543210"
    const email = order?.email || "customer@example.com"

    const orderItems = items.map(item => ({
      name: item.title,
      sku: item.sku || "PRO-SKU",
      units: item.quantity,
      selling_price: item.unit_price || 0, // Medusa v2 stores prices directly in INR
      discount: 0
    }))

    let subTotal = 0
    orderItems.forEach(i => subTotal += (i.selling_price * i.units))

    const shippingFee = order?.shipping_total ?? order?.summary?.shipping_total ?? order?.shipping_methods?.[0]?.amount ?? 0
    const shippingCharges = shippingFee // Medusa v2 stores directly in INR

    const orderData = {
      order_id: `PRO-${order?.id?.substring(order.id.length - 8) || Date.now()}`,
      order_date: new Date().toISOString().split('T')[0],
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
      sub_total: subTotal,
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
