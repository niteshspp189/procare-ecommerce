import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPgConnection } from "../../../admin/custom/banners/route"

/**
 * GET /store/custom/coupon-info?code=OFFER26
 * Public store endpoint to retrieve promotion details for customer feedback (e.g. min spend threshold).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const rawCode = (req.query?.code as string) || ""
    if (!rawCode.trim()) {
      return res.status(400).json({ success: false, message: "Code parameter is required" })
    }

    const cleanCode = rawCode.trim().toUpperCase()
    const knex = getPgConnection(req)

    const row = await knex("promotion as p")
      .select(
        "p.id",
        "p.code",
        "p.status",
        "p.type as promo_type",
        "p.limit",
        "p.used",
        "am.type as discount_type",
        "am.value as discount_value",
        "c.starts_at",
        "c.ends_at",
        knex.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'attribute', pr.attribute,
                'operator', pr.operator,
                'value', prv.value
              )
            ) FILTER (WHERE pr.id IS NOT NULL),
            '[]'
          ) as rules
        `)
      )
      .leftJoin("promotion_application_method as am", "am.promotion_id", "p.id")
      .leftJoin("promotion_campaign as c", "c.id", "p.campaign_id")
      .leftJoin("promotion_promotion_rule as ppr", "ppr.promotion_id", "p.id")
      .leftJoin("promotion_rule as pr", "pr.id", "ppr.promotion_rule_id")
      .leftJoin("promotion_rule_value as prv", "prv.promotion_rule_id", "pr.id")
      .whereRaw("UPPER(p.code) = ?", [cleanCode])
      .whereNull("p.deleted_at")
      .groupBy("p.id", "am.id", "c.id")
      .first()

    if (!row) {
      return res.json({ success: true, exists: false, code: cleanCode })
    }

    const minSpendRule = Array.isArray(row.rules)
      ? row.rules.find((r: any) => r.attribute === "item_total" && r.operator === "gte")
      : null

    const rawMinSpend = minSpendRule ? Number(minSpendRule.value) : 0
    const grossMinSpend = rawMinSpend > 0 ? Math.round(rawMinSpend * 1.18) : 0

    return res.json({
      success: true,
      exists: true,
      code: row.code,
      status: row.status,
      discount_type: row.discount_type || "percentage",
      discount_value: Number(row.discount_value) || 0,
      min_order_value: grossMinSpend,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      limit: row.limit,
      used: row.used || 0,
    })
  } catch (error: any) {
    console.error("[Storefront Coupon Info GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
