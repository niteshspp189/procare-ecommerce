import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureBannerTableExists } from "../route"

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pgConnection = req.scope.resolve("pg_connection") as any
    await ensureBannerTableExists(pgConnection)

    const existing = await pgConnection("cms_banner").where("id", id).first()
    if (!existing) {
      return res.status(404).json({ success: false, message: "Banner not found" })
    }

    const {
      title,
      type,
      desktop_image_url,
      mobile_image_url,
      link_url,
      alt_text,
      is_active,
      display_order,
    } = req.body as any

    const updates: Record<string, any> = {
      updated_at: new Date(),
    }

    if (title !== undefined) updates.title = title
    if (type !== undefined) updates.type = type
    if (desktop_image_url !== undefined) updates.desktop_image_url = desktop_image_url
    if (mobile_image_url !== undefined) updates.mobile_image_url = mobile_image_url
    if (link_url !== undefined) updates.link_url = link_url
    if (alt_text !== undefined) updates.alt_text = alt_text
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (display_order !== undefined) updates.display_order = Number(display_order)

    await pgConnection("cms_banner").where("id", id).update(updates)

    const updatedBanner = await pgConnection("cms_banner").where("id", id).first()

    return res.json({
      success: true,
      banner: updatedBanner,
      message: "Banner updated successfully",
    })
  } catch (error: any) {
    console.error("[CMS Banner PUT] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pgConnection = req.scope.resolve("pg_connection") as any
    await ensureBannerTableExists(pgConnection)

    const count = await pgConnection("cms_banner").where("id", id).delete()
    if (count === 0) {
      return res.status(404).json({ success: false, message: "Banner not found" })
    }

    return res.json({
      success: true,
      message: "Banner deleted successfully",
    })
  } catch (error: any) {
    console.error("[CMS Banner DELETE] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
