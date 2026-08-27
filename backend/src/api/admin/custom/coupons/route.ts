import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomBytes } from "crypto"

export function getPgConnection(req: MedusaRequest): any {
  let pgConnection: any = null
  try {
    pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION, { allowUnregistered: true })
  } catch {}
  if (!pgConnection) {
    try {
      pgConnection = req.scope.resolve("__pg_connection__", { allowUnregistered: true })
    } catch {}
  }
  if (!pgConnection) {
    try {
      pgConnection = req.scope.resolve("pg_connection", { allowUnregistered: true })
    } catch {}
  }
  if (!pgConnection) {
    const knex = require("knex")
    pgConnection = knex({
      client: "pg",
      connection: process.env.DATABASE_URL,
    })
  }
  return pgConnection
}

function generateId(prefix: string): string {
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
  let id = ""
  const bytes = randomBytes(26)
  for (let i = 0; i < 26; i++) {
    id += chars[bytes[i] % chars.length]
  }
  return `${prefix}_${id}`
}

/**
 * GET /admin/custom/coupons
 * Returns list of all promotional coupons with parsed rules, discount details, and campaign dates.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const knex = getPgConnection(req)

  try {
    const rows = await knex("promotion as p")
      .select(
        "p.id",
        "p.code",
        "p.status",
        "p.type as promo_type",
        "p.is_automatic",
        "p.limit",
        "p.used",
        "p.created_at",
        "p.updated_at",
        "am.id as application_method_id",
        "am.type as discount_type",
        "am.value as discount_value",
        "am.allocation",
        "c.id as campaign_id",
        "c.name as campaign_name",
        "c.starts_at",
        "c.ends_at",
        knex.raw(`
          COALESCE(
            json_agg(
              json_build_object(
                'id', pr.id,
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
      .whereNull("p.deleted_at")
      .groupBy("p.id", "am.id", "c.id")
      .orderBy("p.created_at", "desc")

    const coupons = rows.map((row: any) => {
      const minSpendRule = Array.isArray(row.rules)
        ? row.rules.find((r: any) => r.attribute === "item_total" && r.operator === "gte")
        : null

      // Convert pre-tax rule threshold (e.g. 846) back to gross customer MRP (e.g. 999)
      const rawMinSpend = minSpendRule ? Number(minSpendRule.value) : 0
      const grossMinSpend = rawMinSpend > 0 ? Math.round(rawMinSpend * 1.18) : 0

      return {
        id: row.id,
        code: row.code,
        status: row.status || "active",
        discount_type: row.discount_type || "percentage",
        discount_value: Number(row.discount_value) || 0,
        allocation: row.allocation || "across",
        min_order_value: grossMinSpend,
        raw_threshold: rawMinSpend,
        limit: row.limit,
        used: row.used || 0,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        created_at: row.created_at,
      }
    })

    return res.status(200).json({ success: true, coupons })
  } catch (error: any) {
    console.error("Error fetching custom coupons:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * POST /admin/custom/coupons
 * Creates or updates a coupon with all associated rules, application method, and optional campaign.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const knex = getPgConnection(req)

  try {
    const {
      id,
      code,
      discount_type = "percentage",
      discount_value,
      min_order_value = 0,
      limit = null,
      status = "active",
      starts_at = null,
      ends_at = null,
    } = req.body as any

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required" })
    }

    const cleanCode = code.trim().toUpperCase()
    const numValue = Number(discount_value)
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be greater than 0" })
    }

    const grossMinSpend = Number(min_order_value) || 0
    // Calculate pre-tax threshold with 18% GST (e.g. ₹999 / 1.18 = 846.61 => 846)
    const preTaxThreshold = grossMinSpend > 0 ? Math.round(grossMinSpend / 1.18) : 0

    let promoId = id

    if (promoId) {
      // ── UPDATE EXISTING COUPON ──
      const existing = await knex("promotion").where({ id: promoId }).whereNull("deleted_at").first()
      if (!existing) {
        return res.status(404).json({ success: false, message: "Promotion not found" })
      }

      let campaignId = existing.campaign_id

      if (starts_at || ends_at) {
        if (campaignId) {
          await knex("promotion_campaign").where({ id: campaignId }).update({
            name: `${cleanCode} Campaign`,
            starts_at: starts_at ? new Date(starts_at) : null,
            ends_at: ends_at ? new Date(ends_at) : null,
            updated_at: new Date(),
          })
        } else {
          campaignId = generateId("procamp")
          await knex("promotion_campaign").insert({
            id: campaignId,
            name: `${cleanCode} Campaign`,
            campaign_identifier: cleanCode.toLowerCase(),
            starts_at: starts_at ? new Date(starts_at) : null,
            ends_at: ends_at ? new Date(ends_at) : null,
            created_at: new Date(),
            updated_at: new Date(),
          })
        }
      } else if (campaignId && !starts_at && !ends_at) {
        // Clear dates if removed
        await knex("promotion_campaign").where({ id: campaignId }).update({
          starts_at: null,
          ends_at: null,
          updated_at: new Date(),
        })
      }

      await knex("promotion").where({ id: promoId }).update({
        code: cleanCode,
        status,
        limit: limit ? Number(limit) : null,
        campaign_id: campaignId,
        updated_at: new Date(),
      })

      await knex("promotion_application_method").where({ promotion_id: promoId }).update({
        type: discount_type,
        value: numValue,
        raw_value: JSON.stringify({ value: numValue.toString(), precision: 20 }),
        allocation: "across",
        updated_at: new Date(),
      })

      // Update threshold rule
      const linkedRules = await knex("promotion_promotion_rule as ppr")
        .select("pr.id as rule_id")
        .join("promotion_rule as pr", "pr.id", "ppr.promotion_rule_id")
        .where("ppr.promotion_id", promoId)
        .where("pr.attribute", "item_total")

      if (preTaxThreshold > 0) {
        if (linkedRules.length > 0) {
          const ruleId = linkedRules[0].rule_id
          await knex("promotion_rule_value").where({ promotion_rule_id: ruleId }).update({
            value: preTaxThreshold.toString(),
            updated_at: new Date(),
          })
        } else {
          const ruleId = generateId("prorul")
          const valId = generateId("prorval")
          await knex("promotion_rule").insert({
            id: ruleId,
            description: `${cleanCode}_MIN_SPEND`,
            attribute: "item_total",
            operator: "gte",
            created_at: new Date(),
            updated_at: new Date(),
          })
          await knex("promotion_rule_value").insert({
            id: valId,
            promotion_rule_id: ruleId,
            value: preTaxThreshold.toString(),
            created_at: new Date(),
            updated_at: new Date(),
          })
          await knex("promotion_promotion_rule").insert({
            promotion_id: promoId,
            promotion_rule_id: ruleId,
          })
        }
      } else {
        // Remove threshold rule if 0
        if (linkedRules.length > 0) {
          const ruleId = linkedRules[0].rule_id
          await knex("promotion_promotion_rule").where({ promotion_id: promoId, promotion_rule_id: ruleId }).delete()
          await knex("promotion_rule_value").where({ promotion_rule_id: ruleId }).delete()
          await knex("promotion_rule").where({ id: ruleId }).delete()
        }
      }
    } else {
      // ── CREATE NEW COUPON ──
      // Check code uniqueness
      const existing = await knex("promotion").where({ code: cleanCode }).whereNull("deleted_at").first()
      if (existing) {
        return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists` })
      }

      promoId = generateId("promo")
      let campaignId: string | null = null

      if (starts_at || ends_at) {
        campaignId = generateId("procamp")
        await knex("promotion_campaign").insert({
          id: campaignId,
          name: `${cleanCode} Campaign`,
          campaign_identifier: cleanCode.toLowerCase(),
          starts_at: starts_at ? new Date(starts_at) : null,
          ends_at: ends_at ? new Date(ends_at) : null,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      await knex("promotion").insert({
        id: promoId,
        code: cleanCode,
        campaign_id: campaignId,
        is_automatic: false,
        type: "standard",
        status,
        is_tax_inclusive: false,
        limit: limit ? Number(limit) : null,
        used: 0,
        created_at: new Date(),
        updated_at: new Date(),
      })

      const appMethodId = generateId("proappmet")
      await knex("promotion_application_method").insert({
        id: appMethodId,
        value: numValue,
        raw_value: JSON.stringify({ value: numValue.toString(), precision: 20 }),
        type: discount_type,
        target_type: "items",
        allocation: "across",
        promotion_id: promoId,
        created_at: new Date(),
        updated_at: new Date(),
      })

      if (preTaxThreshold > 0) {
        const ruleId = generateId("prorul")
        const valId = generateId("prorval")
        await knex("promotion_rule").insert({
          id: ruleId,
          description: `${cleanCode}_MIN_SPEND`,
          attribute: "item_total",
          operator: "gte",
          created_at: new Date(),
          updated_at: new Date(),
        })
        await knex("promotion_rule_value").insert({
          id: valId,
          promotion_rule_id: ruleId,
          value: preTaxThreshold.toString(),
          created_at: new Date(),
          updated_at: new Date(),
        })
        await knex("promotion_promotion_rule").insert({
          promotion_id: promoId,
          promotion_rule_id: ruleId,
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: promoId === id ? "Coupon updated successfully" : "Coupon created successfully",
      coupon_id: promoId,
    })
  } catch (error: any) {
    console.error("Error saving coupon:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * DELETE /admin/custom/coupons
 * Deletes or archives a promotional coupon.
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const knex = getPgConnection(req)

  try {
    const id = (req.query?.id as string) || (req.body as any)?.id
    if (!id) {
      return res.status(400).json({ success: false, message: "Coupon ID is required" })
    }

    const promo = await knex("promotion").where({ id }).first()
    if (!promo) {
      return res.status(404).json({ success: false, message: "Promotion not found" })
    }

    // Soft delete or delete rules
    const linkedRules = await knex("promotion_promotion_rule").where({ promotion_id: id })
    for (const lr of linkedRules) {
      await knex("promotion_rule_value").where({ promotion_rule_id: lr.promotion_rule_id }).delete()
      await knex("promotion_promotion_rule").where({ promotion_id: id, promotion_rule_id: lr.promotion_rule_id }).delete()
      await knex("promotion_rule").where({ id: lr.promotion_rule_id }).delete()
    }

    await knex("promotion_application_method").where({ promotion_id: id }).delete()
    await knex("promotion").where({ id }).delete()

    return res.status(200).json({ success: true, message: "Coupon deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting coupon:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
