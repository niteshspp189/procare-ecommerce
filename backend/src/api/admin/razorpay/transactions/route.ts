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

    // Fetch payments starting from April 1, 2026 (store launch)
    const [paymentResponse, orderResponse] = await Promise.all([
      rzp.payments.all({
        from: 1775001600,
        count: 100,
        skip: 0
      }),
      rzp.orders.all({
        from: 1775001600,
        count: 100,
        skip: 0
      })
    ])

    const payments = paymentResponse.items
    const rzpOrders = orderResponse.items

    // Fetch Medusa orders that might have Razorpay payments
    // We fetch orders with their payments
    const query = req.scope.resolve("query")
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id", "payment_collections.payment_sessions.*"],
      pagination: { skip: 0, take: 500 }
    })

    // Create a mapping of razorpay_order_id or payment_id to Medusa Order details
    const rzpOrderToMedusaOrder: Record<string, { display_id: string, id: string }> = {}
    
    for (const order of orders) {
      const o = order as any;
      const sessions = o.payment_collections?.flatMap((pc: any) => pc.payment_sessions || []) || [];
      if (sessions.length > 0) {
        for (const session of sessions) {
          if (session.provider_id?.includes("razorpay") && session.data) {
             const keysToMatch = ["id", "order_id", "payment_id", "razorpay_order_id", "razorpay_payment_id"];
              for (const key of keysToMatch) {
               if (session.data[key]) {
                 rzpOrderToMedusaOrder[session.data[key]] = {
                   display_id: `OD${(o.display_id || o.id).toString().padStart(8, '0')}`,
                   id: o.id
                 };
               }
             }
          }
        }
      }
    }

    // Fetch carts to map missing orders to cart_uuid for manual sync
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id", "email", "total", "subtotal", "tax_total", "shipping_total", "discount_total",
        "payment_collection.payment_sessions.*",
        "items.*",
        "items.variant.*",
        "shipping_address.*",
        "billing_address.*"
      ],
      pagination: { skip: 0, take: 500 }
    })
    
    const rzpOrderToMedusaCart: Record<string, any> = {}
    for (const cart of carts) {
      const c = cart as any;
      const sessions = c.payment_collection?.payment_sessions || [];
      for (const session of sessions) {
        if (session.provider_id?.includes("razorpay") && session.data) {
          const keysToMatch = ["id", "order_id", "payment_id", "razorpay_order_id", "razorpay_payment_id"];
          for (const key of keysToMatch) {
            if (session.data[key]) {
              rzpOrderToMedusaCart[session.data[key]] = c;
            }
          }
        }
      }
    }

    // Annotate the Razorpay payments with the corresponding Medusa order details
    const annotatedPayments = payments.map((p: any) => {
      // p.order_id is the Razorpay order ID
      const medusaOrder = rzpOrderToMedusaOrder[p.order_id] || rzpOrderToMedusaOrder[p.id] || null
      const cart = rzpOrderToMedusaCart[p.order_id] || rzpOrderToMedusaCart[p.id] || null
      return {
        ...p,
        type: 'payment',
        medusa_order_display_id: medusaOrder?.display_id || null,
        medusa_order_uuid: medusaOrder?.id || null,
        medusa_cart: cart
      }
    })

    // Filter out orders that are already paid (we have their payments above)
    const incompleteOrders = rzpOrders
      .filter((o: any) => o.status === 'created' || o.status === 'attempted')
      .map((o: any) => {
        const medusaOrder = rzpOrderToMedusaOrder[o.id] || null
        const cart = rzpOrderToMedusaCart[o.id] || rzpOrderToMedusaCart[o.order_id] || null
        return {
          ...o,
          type: 'order',
          medusa_order_display_id: medusaOrder?.display_id || null,
          medusa_order_uuid: medusaOrder?.id || null,
          medusa_cart: cart
        }
      })

    // Combine them and sort by created_at descending
    const allTransactions = [...annotatedPayments, ...incompleteOrders].sort((a, b) => b.created_at - a.created_at)

    res.json({ payments: allTransactions })
  } catch (err: any) {
    console.error("Error fetching Razorpay transactions:", err)
    res.status(500).json({ message: err.message })
  }
}
