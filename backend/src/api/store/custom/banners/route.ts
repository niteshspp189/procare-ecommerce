import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureBannerTableExists } from "../../../admin/custom/banners/route"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = req.scope.resolve("pg_connection") as any
    await ensureBannerTableExists(pgConnection)

    const type = (req.query.type as string) || "hero"

    const banners = await pgConnection("cms_banner")
      .where("is_active", true)
      .where("type", type)
      .orderBy("display_order", "asc")
      .orderBy("created_at", "desc")

    return res.json({
      success: true,
      banners,
      count: banners.length,
    })
  } catch (error: any) {
    console.error("[Storefront CMS Banners GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message, banners: [] })
  }
}
