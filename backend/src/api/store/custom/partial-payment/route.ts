import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export interface PartialPaymentConfig {
  enabled: boolean
  percentage: number
  min_order_value: number
  label: string
}

export const DEFAULT_PARTIAL_PAYMENT_CONFIG: PartialPaymentConfig = {
  enabled: true,
  percentage: 15, // 15% advance by default (can be 10% or 15%)
  min_order_value: 0,
  label: "Partial COD (Pay 15% Online + 85% on Delivery)",
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection =
      (req.scope as any).__pg_connection__ ||
      req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION, { allowUnregistered: true })

    const store = await pgConnection("store").select("id", "metadata").first()
    let config = DEFAULT_PARTIAL_PAYMENT_CONFIG

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
    console.error("[Partial Payment Store GET] Error:", error)
    return res.json({
      success: true,
      config: DEFAULT_PARTIAL_PAYMENT_CONFIG,
    })
  }
}
