import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query")

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id", 
        "status", 
        "total", 
        "customer_id",
        "payment_collections.*",
        "fulfillments.*"
      ],
      pagination: {
        skip: 0,
        take: 10000,
      }
    })

    const totalOrders = orders.length
    let completed = 0
    let refundedOrReturned = 0
    let needsShipping = 0
    let totalRevenue = 0
    const customers = new Set()

    for (const order of orders) {
      if (order.customer_id) {
        customers.add(order.customer_id)
      }
      
      totalRevenue += (order.total || 0)

      const isCaptured = order.payment_collections?.some((pc: any) => pc.status === "captured" || pc.status === "authorized" || (pc.captured_amount && pc.captured_amount > 0))
      const isFulfilled = order.fulfillments?.some((f: any) => !f.canceled_at)

      if (order.status === "completed" || (isCaptured && isFulfilled)) {
        completed++
      }
      
      const hasRefunds = order.payment_collections?.some((pc: any) => pc.refunded_amount && pc.refunded_amount > 0)
      if (hasRefunds || order.status === "canceled") {
        refundedOrReturned++
      }

      const hasFulfillments = order.fulfillments?.some((f: any) => !f.canceled_at)
      if (!hasFulfillments && order.status !== "canceled") {
        needsShipping++
      }
    }

    res.json({
      stats: {
        totalOrders,
        completed,
        refundedOrReturned,
        needsShipping,
        totalRevenue,
        activeCustomers: customers.size
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
