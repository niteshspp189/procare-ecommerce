import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { syncOrderToShiprocket } from "../../../../../lib/shiprocket-sync"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id } = req.body as { order_id: string }

  if (!order_id) {
    return res.status(400).json({ success: false, message: "order_id is required" })
  }

  try {
    console.log(`[AdminSyncShiprocket] Manual fulfillment trigger for order: ${order_id}`)
    const result = await syncOrderToShiprocket(order_id, req.scope)

    if (result.success) {
      return res.json(result)
    } else {
      return res.status(400).json(result)
    }
  } catch (error: any) {
    console.error("[AdminSyncShiprocket] Error:", error)
    return res.status(500).json({ success: false, message: error.message || "Failed to sync order" })
  }
}
