import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query")
    const { 
      limit = "1000", 
      offset = "0", 
      search = "", 
      status = "all", 
      sort = "created_at_desc",
      date_range = "all_time"
    } = req.query as Record<string, string>

    const take = Math.min(parseInt(limit, 10) || 1000, 5000)
    const skip = parseInt(offset, 10) || 0

    // Fetch all relevant orders
    const { data: allOrders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "created_at",
        "updated_at",
        "email",
        "currency_code",
        "summary.*",
        "customer_id",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "customer.phone",
        "shipping_address.*",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.thumbnail",
        "payment_collections.id",
        "payment_collections.status",
        "payment_collections.amount",
        "payment_collections.captured_amount",
        "payment_collections.refunded_amount",
        "fulfillments.id",
        "fulfillments.canceled_at",
        "fulfillments.shipped_at",
        "fulfillments.data",
        "metadata"
      ],
      pagination: {
        skip: 0,
        take: 10000,
      }
    })

    // Determine date boundary
    const now = new Date()
    let startDate: Date | null = null

    if (date_range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    } else if (date_range === "last_7_days") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (date_range === "last_30_days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else if (date_range === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    }

    // Enrich all orders
    const enrichedOrders = allOrders.map((order: any) => {
      let orderTotal = 0
      if (typeof order.summary?.current_order_total === "number" && order.summary.current_order_total > 0) {
        orderTotal = order.summary.current_order_total
      } else if (typeof order.summary?.totals?.current_order_total === "number" && order.summary.totals.current_order_total > 0) {
        orderTotal = order.summary.totals.current_order_total
      } else if (typeof order.summary?.accounting_total === "number" && order.summary.accounting_total > 0) {
        orderTotal = order.summary.accounting_total
      } else if (typeof order.summary?.totals?.accounting_total === "number" && order.summary.totals.accounting_total > 0) {
        orderTotal = order.summary.totals.accounting_total
      } else if (order.payment_collections && order.payment_collections.length > 0) {
        const pcTotal = order.payment_collections.reduce((sum: number, pc: any) => {
          return sum + (Number(pc.amount) || Number(pc.captured_amount) || 0)
        }, 0)
        if (pcTotal > 0) orderTotal = pcTotal
      }
      
      if (orderTotal === 0 && order.items && order.items.length > 0) {
        orderTotal = order.items.reduce((sum: number, it: any) => {
          return sum + ((Number(it.unit_price) || 0) * (Number(it.quantity) || 1))
        }, 0)
      }

      const isCaptured = order.payment_collections?.some(
        (pc: any) => pc.status === "captured" || pc.status === "completed" || (pc.captured_amount && pc.captured_amount > 0)
      )
      const hasRefunds = order.payment_collections?.some(
        (pc: any) => pc.refunded_amount && pc.refunded_amount > 0
      )
      const isFulfilled = order.fulfillments?.some((f: any) => !f.canceled_at)
      const isShipped = order.fulfillments?.some((f: any) => f.shipped_at && !f.canceled_at)

      let computedStatus = "pending_fulfillment"
      if (order.status === "canceled") {
        computedStatus = "canceled"
      } else if (hasRefunds) {
        computedStatus = "refunded"
      } else if (order.status === "completed" || (isCaptured && isFulfilled)) {
        computedStatus = "completed"
      }

      let paymentState = "pending"
      if (hasRefunds) paymentState = "refunded"
      else if (isCaptured) paymentState = "captured"

      let fulfillmentState = "not_fulfilled"
      if (isShipped) fulfillmentState = "shipped"
      else if (isFulfilled) fulfillmentState = "fulfilled"

      const customerName = [
        order.customer?.first_name || order.shipping_address?.first_name || "",
        order.customer?.last_name || order.shipping_address?.last_name || ""
      ].filter(Boolean).join(" ") || "Guest User"

      const customerPhone = order.customer?.phone || order.shipping_address?.phone || "-"
      const customerEmail = order.email || order.customer?.email || "-"
      const displayId = order.display_id ? `#${order.display_id}` : `#${order.id.slice(-4)}`

      return {
        ...order,
        total: orderTotal,
        displayId,
        computedStatus,
        paymentState,
        fulfillmentState,
        customerName,
        customerPhone,
        customerEmail,
      }
    })

    // Filter by Date Range (if specified)
    let dateFilteredOrders = enrichedOrders
    if (startDate) {
      dateFilteredOrders = enrichedOrders.filter((o: any) => {
        const orderDate = new Date(o.created_at)
        return orderDate >= startDate!
      })
    }

    // Compute stats based on the selected Date Range
    let totalCount = dateFilteredOrders.length
    let completedCount = 0
    let needsShippingCount = 0
    let refundedCount = 0
    let canceledCount = 0
    let totalRevenue = 0

    for (const o of dateFilteredOrders) {
      totalRevenue += o.total || 0
      if (o.computedStatus === "completed") completedCount++
      else if (o.computedStatus === "pending_fulfillment") needsShippingCount++
      else if (o.computedStatus === "refunded") refundedCount++
      else if (o.computedStatus === "canceled") canceledCount++
    }

    // Filter by Search Query
    let filtered = dateFilteredOrders
    if (search && search.trim()) {
      const q = search.toLowerCase().trim()
      filtered = filtered.filter((o: any) => 
        o.displayId.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        (o.items && o.items.some((it: any) => it.title && it.title.toLowerCase().includes(q)))
      )
    }

    // Filter by Status Tab
    if (status && status !== "all") {
      if (status === "completed") {
        filtered = filtered.filter((o: any) => o.computedStatus === "completed")
      } else if (status === "needs_shipping" || status === "pending_fulfillment") {
        filtered = filtered.filter((o: any) => o.computedStatus === "pending_fulfillment")
      } else if (status === "refunded") {
        filtered = filtered.filter((o: any) => o.computedStatus === "refunded")
      } else if (status === "canceled") {
        filtered = filtered.filter((o: any) => o.computedStatus === "canceled")
      } else if (status === "payment_captured") {
        filtered = filtered.filter((o: any) => o.paymentState === "captured")
      } else if (status === "payment_pending") {
        filtered = filtered.filter((o: any) => o.paymentState === "pending")
      }
    }

    // Sort
    if (sort === "created_at_asc") {
      filtered.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else if (sort === "total_desc") {
      filtered.sort((a: any, b: any) => (b.total || 0) - (a.total || 0))
    } else if (sort === "total_asc") {
      filtered.sort((a: any, b: any) => (a.total || 0) - (b.total || 0))
    } else {
      // default: created_at_desc
      filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    const filteredCount = filtered.length
    const paginatedOrders = filtered.slice(skip, skip + take)

    return res.json({
      orders: paginatedOrders,
      count: filteredCount,
      totalCount,
      stats: {
        totalOrders: totalCount,
        completed: completedCount,
        needsShipping: needsShippingCount,
        refundedOrReturned: refundedCount,
        canceled: canceledCount,
        totalRevenue
      }
    })
  } catch (error: any) {
    console.error("Admin custom orders list error:", error)
    return res.status(500).json({ message: error.message || "Failed to fetch orders" })
  }
}
