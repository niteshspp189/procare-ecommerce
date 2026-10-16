import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DEFAULT_PARTIAL_PAYMENT_CONFIG, PartialPaymentConfig } from "../../../store/custom/partial-payment/route"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection =
      (req.scope as any).__pg_connection__ ||
      req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION, { allowUnregistered: true })

    const store = await pgConnection("store").select("id", "metadata").first()
    let config: PartialPaymentConfig = DEFAULT_PARTIAL_PAYMENT_CONFIG

    if (store && store.metadata) {
      const meta = typeof store.metadata === "string" ? JSON.parse(store.metadata) : store.metadata
      if (meta.partial_payment) {
        config = {
          ...DEFAULT_PARTIAL_PAYMENT_CONFIG,
          ...meta.partial_payment,
        }
      }
    }

    return res.json({
      success: true,
      config,
    })
  } catch (error: any) {
    console.error("[Partial Payment Admin GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection =
      (req.scope as any).__pg_connection__ ||
      req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION, { allowUnregistered: true })

    const { enabled, percentage, min_order_value } = req.body as PartialPaymentConfig

    const store = await pgConnection("store").select("id", "metadata").first()
    if (!store) {
      return res.status(404).json({ success: false, message: "Store not found" })
    }

    const currentMeta = typeof store.metadata === "string" ? JSON.parse(store.metadata) : (store.metadata || {})
    const validPct = [10, 15, 20, 25].includes(Number(percentage)) ? Number(percentage) : 15

    const updatedConfig: PartialPaymentConfig = {
      enabled: Boolean(enabled),
      percentage: validPct,
      min_order_value: Math.max(0, Number(min_order_value) || 0),
      label: `Partial COD (Pay ${validPct}% Online + ${100 - validPct}% on Delivery)`,
    }

    const updatedMeta = {
      ...currentMeta,
      partial_payment: updatedConfig,
    }

    await pgConnection("store")
      .where({ id: store.id })
      .update({
        metadata: JSON.stringify(updatedMeta),
      })

    return res.json({
      success: true,
      message: "Partial payment settings updated successfully",
      config: updatedConfig,
    })
  } catch (error: any) {
    console.error("[Partial Payment Admin POST] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
