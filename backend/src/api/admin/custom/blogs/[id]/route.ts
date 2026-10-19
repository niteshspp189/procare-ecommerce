import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getPgConnection, ensureBlogTableExists } from "../route"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const post = await pgConnection("cms_blog_post").where("id", id).first()
    if (!post) {
      return res.status(404).json({ success: false, message: "Blog post not found" })
    }

    return res.json({ success: true, post })
  } catch (error: any) {
    console.error("[CMS Blogs GET ID] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const {
      title,
      slug,
      excerpt,
      content,
      category,
      featured_image,
      author,
      read_time,
      is_published,
      display_order,
    } = req.body as any

    const existing = await pgConnection("cms_blog_post").where("id", id).first()
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog post not found" })
    }

    const updates: any = {
      updated_at: new Date(),
    }

    if (title !== undefined) updates.title = title.trim()
    if (slug !== undefined) {
      updates.slug = slug
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    }
    if (excerpt !== undefined) updates.excerpt = excerpt ? excerpt.trim() : null
    if (content !== undefined) updates.content = content.trim()
    if (category !== undefined) updates.category = category && category.trim() ? category.trim() : null
    if (featured_image !== undefined) updates.featured_image = featured_image ? featured_image.trim() : null
    if (author !== undefined) updates.author = author ? author.trim() : "PRO Care Editorial"
    if (read_time !== undefined) updates.read_time = read_time ? read_time.trim() : "4 min read"
    if (is_published !== undefined) updates.is_published = Boolean(is_published)
    if (display_order !== undefined) updates.display_order = Number(display_order) || 0

    await pgConnection("cms_blog_post").where("id", id).update(updates)

    const updated = await pgConnection("cms_blog_post").where("id", id).first()

    return res.json({
      success: true,
      post: updated,
      message: "Blog post updated successfully",
    })
  } catch (error: any) {
    console.error("[CMS Blogs PUT ID] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const deleted = await pgConnection("cms_blog_post").where("id", id).del()
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Blog post not found" })
    }

    return res.json({
      success: true,
      message: "Blog post deleted successfully",
    })
  } catch (error: any) {
    console.error("[CMS Blogs DELETE ID] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
