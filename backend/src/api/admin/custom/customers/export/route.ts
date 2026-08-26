import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query")

    const [{ data: customers }, { data: orders }] = await Promise.all([
      query.graph({
        entity: "customer",
        fields: [
          "id",
          "first_name",
          "last_name",
          "email",
          "phone",
          "created_at",
          "addresses.*",
        ],
        pagination: { skip: 0, take: 5000 },
      }),
      query.graph({
        entity: "order",
        fields: [
          "id",
          "customer_id",
          "email",
          "summary.*",
          "status",
        ],
        pagination: { skip: 0, take: 5000 },
      }),
    ])

    // Compute order counts and spend per customer
    const customerStats: Record<string, { orderCount: number; totalSpent: number }> = {}

    for (const order of orders) {
      const custId = order.customer_id || order.email
      if (!custId) continue

      if (!customerStats[custId]) {
        customerStats[custId] = { orderCount: 0, totalSpent: 0 }
      }

      customerStats[custId].orderCount += 1
      const total = Number((order as any).summary?.current_order_total || (order as any).summary?.accounting_total || 0)
      customerStats[custId].totalSpent += total
    }

    const enrichedCustomers = customers.map((c: any) => {
      const stats = customerStats[c.id] || customerStats[c.email] || { orderCount: 0, totalSpent: 0 }
      const defaultAddress = c.addresses?.[0] || {}

      return {
        id: c.id,
        first_name: c.first_name || "",
        last_name: c.last_name || "",
        name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Guest User",
        email: c.email || "",
        phone: c.phone || defaultAddress.phone || "",
        address_1: defaultAddress.address_1 || "",
        city: defaultAddress.city || "",
        province: defaultAddress.province || "",
        postal_code: defaultAddress.postal_code || "",
        country_code: defaultAddress.country_code || "IN",
        order_count: stats.orderCount,
        total_spent: stats.totalSpent,
        created_at: c.created_at,
      }
    })

    return res.json({
      success: true,
      customers: enrichedCustomers,
      count: enrichedCustomers.length,
    })
  } catch (error: any) {
    console.error("[CustomerExport] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
