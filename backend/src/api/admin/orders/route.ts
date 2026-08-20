import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve("query")
    
    const { limit = 15, offset = 0, order = "-created_at", ...filters } = req.query as any
    
    // Default sorting
    let sortBy = "created_at"
    let sortDir = "DESC"

    if (typeof order === "string") {
      if (order.startsWith("-")) {
        sortDir = "DESC"
        sortBy = order.substring(1)
      } else {
        sortDir = "ASC"
        sortBy = order
      }
    }

    // Clean up filters to remove Next.js/Admin extra stuff if any
    const cleanFilters: Record<string, any> = { ...filters }
    delete cleanFilters.fields
    delete cleanFilters.limit
    delete cleanFilters.offset
    delete cleanFilters.order

    // Exclude drafts
    cleanFilters.is_draft_order = false

    // Try to execute via query graph
    const { data: orders, metadata } = await query.graph({
      entity: "order",
      fields: req.queryConfig?.fields || [
        "*", 
        "customer.*", 
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "payment_collections.*",
        "fulfillments.*",
        "region.*",
        "sales_channel.*"
      ],
      filters: cleanFilters,
      pagination: {
        skip: parseInt(offset as string),
        take: parseInt(limit as string),
        order: {
          [sortBy]: sortDir
        }
      }
    })

    res.json({
      orders: orders,
      count: metadata?.count || orders.length,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string)
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
