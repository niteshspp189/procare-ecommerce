import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Admin manual toggle to mark Partial COD balance as collected
 * POST /admin/custom/orders/:id/partial-cod-collect
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params

    const pgConnection =
      (req.scope as any).__pg_connection__ ||
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      return res.status(500).json({ error: "Database connection unavailable" })
    }

    const order = await pgConnection("order").where("id", id).first()
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }

    const currentMeta =
      typeof order.metadata === "string" ? JSON.parse(order.metadata) : order.metadata || {}

    const isAlreadyCollected = Boolean(currentMeta.cod_balance_collected)
    const newCollectedState = !isAlreadyCollected

    const updatedMeta = {
      ...currentMeta,
      cod_balance_collected: newCollectedState,
      cod_collected_at: newCollectedState ? new Date() : null,
      settlement_status: newCollectedState ? "fully_paid" : "advance_only",
      note: newCollectedState
        ? `✅ Manually verified: ₹${currentMeta.advance_paid || 0} paid online advance (${currentMeta.partial_percentage || 15}%), ₹${currentMeta.cod_balance || 0} collected at doorstep on delivery. Order fully settled.`
        : `⚡ Partial COD: ₹${currentMeta.advance_paid || 0} paid online advance (${currentMeta.partial_percentage || 15}%), ₹${currentMeta.cod_balance || 0} pending doorstep collection.`,
    }

    await pgConnection("order").where("id", id).update({
      metadata: JSON.stringify(updatedMeta),
      updated_at: new Date(),
    })

    return res.status(200).json({
      success: true,
      cod_balance_collected: newCollectedState,
      metadata: updatedMeta,
    })
  } catch (err: any) {
    console.error("[PartialCodCollect] Error:", err.message)
    return res.status(500).json({ error: err.message })
  }
}
