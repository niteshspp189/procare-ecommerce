import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id, order_ids, is_archived = true } = req.body as {
    order_id?: string
    order_ids?: string[]
    is_archived?: boolean
  }

  const idsToProcess = order_ids && Array.isArray(order_ids) ? order_ids : (order_id ? [order_id] : [])

  if (idsToProcess.length === 0) {
    return res.status(400).json({ success: false, message: "order_id or order_ids array is required" })
  }

  try {
    const pgConnection = (req.scope as any).__pg_connection__ || 
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      return res.status(500).json({ success: false, message: "Database connection unavailable" })
    }

    const now = new Date().toISOString()

    for (const id of idsToProcess) {
      const order = await pgConnection("order").where("id", id).first()
      if (!order) continue

      const currentMetadata = typeof order.metadata === "object" && order.metadata !== null ? order.metadata : {}
      const updatedMetadata = {
        ...currentMetadata,
        is_archived: Boolean(is_archived),
        archived_at: is_archived ? now : null,
      }

      await pgConnection("order").where("id", id).update({
        metadata: JSON.stringify(updatedMetadata),
        updated_at: new Date(),
      })
    }

    const actionText = is_archived ? "archived" : "unarchived"
    return res.json({
      success: true,
      message: `Order(s) successfully ${actionText}`,
      count: idsToProcess.length,
    })
  } catch (error: any) {
    console.error("[AdminArchiveOrder] Error:", error)
    return res.status(500).json({ success: false, message: error.message || "Failed to update archive status" })
  }
}
