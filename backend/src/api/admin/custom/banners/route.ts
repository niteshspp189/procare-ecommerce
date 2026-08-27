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

export const DEFAULT_SEED_BANNERS = [
  {
    id: "banner_hero_default",
    title: "Homepage Hero Banner",
    type: "hero",
    desktop_image_url: "/images/landing-page-images/hero-banner-desktop.jpg",
    mobile_image_url: "/images/landing-page-images/hero-banner-mobile.jpg",
    link_url: "/shop",
    alt_text: "Shop Pro Care Shoe Care Products",
    is_active: true,
    display_order: 0,
  },
  // Homepage Category Showcase Cards
  {
    id: "banner_cat_card_shoecare",
    title: "Shoe Care - Category Card",
    type: "category_card",
    desktop_image_url: "/images/landing-page-images/cat-shoecare-new.webp",
    mobile_image_url: "/images/landing-page-images/cat-shoecare-new.webp",
    link_url: "/categories/shoe-care",
    alt_text: "Shoe Care",
    is_active: true,
    display_order: 1,
  },
  {
    id: "banner_cat_card_insoles",
    title: "Insoles - Category Card",
    type: "category_card",
    desktop_image_url: "/images/landing-page-images/cat-insoles-new.webp",
    mobile_image_url: "/images/landing-page-images/cat-insoles-new.webp",
    link_url: "/categories/insoles",
    alt_text: "Insoles",
    is_active: true,
    display_order: 2,
  },
  {
    id: "banner_cat_card_footcare",
    title: "Foot Care - Category Card",
    type: "category_card",
    desktop_image_url: "/images/landing-page-images/cat-footcare-new.webp",
    mobile_image_url: "/images/landing-page-images/cat-footcare-new.webp",
    link_url: "/categories/foot-care",
    alt_text: "Foot Care",
    is_active: true,
    display_order: 3,
  },
  {
    id: "banner_cat_card_accessories",
    title: "Accessories - Category Card",
    type: "category_card",
    desktop_image_url: "/images/landing-page-images/cat-accessories-new.webp",
    mobile_image_url: "/images/landing-page-images/cat-accessories-new.webp",
    link_url: "/categories/accessories",
    alt_text: "Accessories",
    is_active: true,
    display_order: 4,
  },
  // Category Page Header Banners
  {
    id: "banner_cat_header_shoecare",
    title: "Shoe Care - Header Banner",
    type: "category_banner",
    desktop_image_url: "/images/product-category-images/banner-shoe-care.png",
    mobile_image_url: "/images/product-category-images/banner-shoe-care.png",
    link_url: "/categories/shoe-care",
    alt_text: "Shoe Care Products Header Banner",
    is_active: true,
    display_order: 1,
  },
  {
    id: "banner_cat_header_insoles",
    title: "Insoles - Header Banner",
    type: "category_banner",
    desktop_image_url: "/images/product-category-images/banner-insoles.png",
    mobile_image_url: "/images/product-category-images/banner-insoles.png",
    link_url: "/categories/insoles",
    alt_text: "Insoles Header Banner",
    is_active: true,
    display_order: 2,
  },
  {
    id: "banner_cat_header_footcare",
    title: "Foot Care - Header Banner",
    type: "category_banner",
    desktop_image_url: "/images/product-category-images/banner-foot-care.png",
    mobile_image_url: "/images/product-category-images/banner-foot-care.png",
    link_url: "/categories/foot-care",
    alt_text: "Foot Care Header Banner",
    is_active: true,
    display_order: 3,
  },
  {
    id: "banner_cat_header_accessories",
    title: "Accessories - Header Banner",
    type: "category_banner",
    desktop_image_url: "/images/product-category-images/banner-accessories.png",
    mobile_image_url: "/images/product-category-images/banner-accessories.png",
    link_url: "/categories/accessories",
    alt_text: "Accessories Header Banner",
    is_active: true,
    display_order: 4,
  },
  // Our Story Page Hero Banner
  {
    id: "banner_story_hero",
    title: "Our Story - Top Hero Banner",
    type: "story_hero",
    desktop_image_url: "/images/story-page-banner.png",
    mobile_image_url: "/images/story-page-banner.png",
    link_url: "/our-story",
    alt_text: "Good Shoes Deserve PRO Care - Our Story",
    is_active: true,
    display_order: 1,
  },
  // Our Story 4 Trust Pillar Cards
  {
    id: "banner_story_card_european",
    title: "Our Story - Backed by European Expertise",
    type: "story_card",
    desktop_image_url: "/images/our-story/backed-by-european-expertise.png",
    mobile_image_url: "/images/our-story/backed-by-european-expertise.png",
    link_url: "/our-story",
    alt_text: "Backed by European Expertise",
    is_active: true,
    display_order: 1,
  },
  {
    id: "banner_story_card_excellence",
    title: "Our Story - 15+ Years of Proven Excellence",
    type: "story_card",
    desktop_image_url: "/images/our-story/15-years-of-proven-excellence.png",
    mobile_image_url: "/images/our-story/15-years-of-proven-excellence.png",
    link_url: "/our-story",
    alt_text: "15+ Years of Proven Excellence",
    is_active: true,
    display_order: 2,
  },
  {
    id: "banner_story_card_countries",
    title: "Our Story - Trusted in 17+ Countries",
    type: "story_card",
    desktop_image_url: "/images/our-story/trusted-in-17-countries.png",
    mobile_image_url: "/images/our-story/trusted-in-17-countries.png",
    link_url: "/our-story",
    alt_text: "Trusted in 17+ Countries",
    is_active: true,
    display_order: 3,
  },
  {
    id: "banner_story_card_no1",
    title: "Our Story - India's No. 1 Leading Shoe Care Brand",
    type: "story_card",
    desktop_image_url: "/images/our-story/indias-no-1-shoe-care-brand.png",
    mobile_image_url: "/images/our-story/indias-no-1-shoe-care-brand.png",
    link_url: "/our-story",
    alt_text: "India's No. 1 Leading Shoe Care Brand",
    is_active: true,
    display_order: 4,
  },
  // Our Story Wide Feature Banner
  {
    id: "banner_story_wide_story",
    title: "Our Story - Because Every Pair Has A Story",
    type: "story_wide_banner",
    desktop_image_url: "/images/our-story/every-pair-has-a-story.png",
    mobile_image_url: "/images/our-story/every-pair-has-a-story.png",
    link_url: "/our-story",
    alt_text: "Because every pair has a story. And we're here to help it last.",
    is_active: true,
    display_order: 1,
  },
]

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
  }

  // Ensure all standard default banners exist
  const existingIds = await knex("cms_banner").select("id").then((rows: any[]) => rows.map((r) => r.id))

  for (const banner of DEFAULT_SEED_BANNERS) {
    if (!existingIds.includes(banner.id)) {
      await knex("cms_banner").insert({
        ...banner,
        created_at: new Date(),
        updated_at: new Date(),
      })
    }
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
