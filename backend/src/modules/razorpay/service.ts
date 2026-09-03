import { 
  AbstractPaymentProvider,
} from "@medusajs/framework/utils"
// @ts-ignore
import Razorpay from "razorpay"

class RazorpayPaymentProviderService extends AbstractPaymentProvider {
  static identifier = "razorpay"
  protected razorpay_: any
  protected options_: any

  constructor(container: any, options: any) {
    super(container, options)
    this.options_ = options
    this.razorpay_ = new Razorpay({
      key_id: options.key_id,
      key_secret: options.key_secret,
    })
  }

  async getPaymentStatus(input: any): Promise<any> {
    const data = input.data || {}
    const status = data.status as string
    
    // If razorpay_payment_id is present, payment was completed on client
    if (data.razorpay_payment_id) {
      return "authorized"
    }

    switch (status) {
      case "created":
        return "pending"
      case "authorized":
        return "authorized"
      case "captured":
        return "captured"
      case "refunded":
        return "canceled"
      default:
        return "pending"
    }
  }

  async initiatePayment(input: any): Promise<any> {
    const { amount, currency_code, resource_id } = input
    const existingData = input.data || {}

    // IDEMPOTENCY CHECK: If a Razorpay order already exists on this session, reuse it!
    const targetAmount = Math.round(amount) * 100
    if (existingData.id && String(existingData.id).startsWith("order_")) {
      const existingAmount = existingData.amount
      if (!existingAmount || existingAmount === targetAmount) {
        return {
          data: {
            ...existingData,
            ...(input.data || {}),
          },
        }
      }
    }

    try {
      const order = await this.razorpay_.orders.create({
        amount: targetAmount,
        currency: currency_code.toUpperCase(),
        receipt: resource_id,
        payment_capture: 1,
      })

      return {
        data: {
          ...order,
        },
      }
    } catch (error: any) {
      return {
        error: error.message,
        code: error.code,
      }
    }
  }

  async authorizePayment(input: any): Promise<any> {
    return {
      status: "authorized",
      data: input.data,
    }
  }

  async cancelPayment(input: any): Promise<any> {
    return {
      data: input.data
    }
  }

  async capturePayment(input: any): Promise<any> {
    return {
      data: input.data
    }
  }

  async deletePayment(input: any): Promise<any> {
    return {
      data: input.data
    }
  }

  async refundPayment(input: any): Promise<any> {
    const { data, amount } = input
    const paymentId = data.razorpay_payment_id as string
    
    try {
      await this.razorpay_.payments.refund(paymentId, {
        amount: Math.round(amount) * 100,
      })
      
      return {
        data
      }
    } catch (error: any) {
      return {
        error: error.message,
        code: error.code,
      }
    }
  }

  async retrievePayment(input: any): Promise<any> {
    return {
      data: input.data
    }
  }

  async updatePayment(input: any): Promise<any> {
    const { data } = input
    
    return {
      data: {
        ...data,
      }
    }
  }

  async getWebhookActionAndData(data: any): Promise<any> {
    return {
      action: "not_supported"
    }
  }
}

export default RazorpayPaymentProviderService
