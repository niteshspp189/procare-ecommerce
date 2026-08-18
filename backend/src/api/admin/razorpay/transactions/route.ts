import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Razorpay from "razorpay"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const key_id = process.env.RAZORPAY_ID
    const key_secret = process.env.RAZORPAY_SECRET

    if (!key_id || !key_secret) {
      return res.status(500).json({ message: "Razorpay credentials not found in environment" })
    }

    const rzp = new Razorpay({
      key_id,
      key_secret,
    })

    // Fetch the latest 100 payments
    const response = await rzp.payments.all({
      count: 100,
      skip: 0
    })

    const payments = response.items

    // Fetch Medusa orders that might have Razorpay payments
    // We fetch orders with their payments
    const query = req.scope.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "payments.*"]
    })

    // Create a mapping of razorpay_order_id or payment_id to Medusa Order Display ID
    const rzpOrderToMedusaOrder: Record<string, string> = {}
    
    for (const order of orders) {
      if (order.payments) {
        for (const payment of order.payments) {
          if (payment.provider_id === "razorpay") {
             // The razorpay order ID is usually stored in payment.data.id
             if (payment.data && payment.data.id) {
               rzpOrderToMedusaOrder[payment.data.id] = `OD${(order.display_id || order.id).toString().padStart(8, '0')}`
             }
          }
        }
      }
    }

    // Annotate the Razorpay payments with the corresponding Medusa order ID
    const annotatedPayments = payments.map((p: any) => {
      // p.order_id is the Razorpay order ID
      const medusaOrderId = rzpOrderToMedusaOrder[p.order_id] || null
      return {
        ...p,
        medusa_order_id: medusaOrderId
      }
    })

    res.json({ payments: annotatedPayments })
  } catch (err: any) {
    console.error("Error fetching Razorpay transactions:", err)
    res.status(500).json({ message: err.message })
  }
}
