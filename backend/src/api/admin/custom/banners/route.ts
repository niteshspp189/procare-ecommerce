import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { randomUUID } from "crypto"

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

export async function ensureBannerTableExists(knex: any) {
  const exists = await knex.schema.hasTable("cms_banner")
  if (!exists) {
    await knex.schema.createTable("cms_banner", (table: any) => {
      table.string("id", 255).primary()
      table.string("title", 255).notNullable()
      table.string("type", 50).defaultTo("hero")
      table.text("desktop_image_url").notNullable()
      table.text("mobile_image_url").nullable()
      table.text("link_url").defaultTo("/shop")
      table.text("alt_text").nullable()
      table.boolean("is_active").defaultTo(true)
      table.integer("display_order").defaultTo(0)
      table.timestamp("created_at").defaultTo(knex.fn.now())
      table.timestamp("updated_at").defaultTo(knex.fn.now())
    })

    // Seed default hero banner
    await knex("cms_banner").insert({
      id: `banner_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
      title: "Hero Banner - Default",
      type: "hero",
      desktop_image_url: "/images/landing-page-images/hero-banner-desktop.jpg",
      mobile_image_url: "/images/landing-page-images/hero-banner-mobile.jpg",
      link_url: "/shop",
      alt_text: "Shop Pro Care Shoe Care Products",
      is_active: true,
      display_order: 0,
      created_at: new Date(),
      updated_at: new Date(),
    })
  }
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = getPgConnection(req)
    await ensureBannerTableExists(pgConnection)

    const type = (req.query.type as string) || undefined
    let query = pgConnection("cms_banner").select("*").orderBy("display_order", "asc").orderBy("created_at", "desc")

    if (type) {
      query = query.where("type", type)
    }

    const banners = await query

    return res.json({
      success: true,
      banners,
      count: banners.length,
    })
  } catch (error: any) {
    console.error("[CMS Banner GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = getPgConnection(req)
    await ensureBannerTableExists(pgConnection)

    const {
      title,
      type = "hero",
      desktop_image_url,
      mobile_image_url,
      link_url = "/shop",
      alt_text,
      is_active = true,
      display_order = 0,
    } = req.body as any

    if (!title || !desktop_image_url) {
      return res.status(400).json({
        success: false,
        message: "Title and Desktop Image URL are required",
      })
    }

    const id = `banner_${randomUUID().replace(/-/g, "").slice(0, 24)}`
    const newBanner = {
      id,
      title,
      type,
      desktop_image_url,
      mobile_image_url: mobile_image_url || null,
      link_url: link_url || "/shop",
      alt_text: alt_text || title,
      is_active: Boolean(is_active),
      display_order: Number(display_order) || 0,
      created_at: new Date(),
      updated_at: new Date(),
    }

    await pgConnection("cms_banner").insert(newBanner)

    return res.json({
      success: true,
      banner: newBanner,
      message: "Banner created successfully",
    })
  } catch (error: any) {
    console.error("[CMS Banner POST] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
