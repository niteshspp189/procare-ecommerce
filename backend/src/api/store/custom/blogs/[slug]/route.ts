import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureBlogTableExists, getPgConnection } from "../../../../admin/custom/blogs/route"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { slug } = req.params
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const post = await pgConnection("cms_blog_post")
      .where("slug", slug)
      .where("is_published", true)
      .first()

    if (!post) {
      return res.status(404).json({ success: false, message: "Article not found" })
    }

    // Also fetch 2-3 related articles in the same or nearby category
    const relatedPosts = await pgConnection("cms_blog_post")
      .select("id", "slug", "title", "excerpt", "category", "featured_image", "read_time")
      .where("is_published", true)
      .whereNot("id", post.id)
      .orderBy("display_order", "asc")
      .limit(3)

    return res.json({
      success: true,
      post,
      relatedPosts,
    })
  } catch (error: any) {
    console.error("[Storefront CMS Blog GET Slug] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
