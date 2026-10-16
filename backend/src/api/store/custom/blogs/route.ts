import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ensureBlogTableExists, getPgConnection } from "../../../admin/custom/blogs/route"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = getPgConnection(req)
    await ensureBlogTableExists(pgConnection)

    const category = (req.query.category as string) || undefined
    let query = pgConnection("cms_blog_post")
      .select("id", "slug", "title", "excerpt", "category", "featured_image", "author", "read_time", "published_at", "created_at")
      .where("is_published", true)
      .orderBy("display_order", "asc")
      .orderBy("published_at", "desc")

    if (category && category !== "all") {
      query = query.where("category", category)
    }

    const posts = await query

    // Extract unique active categories for storefront filter tabs
    const allCategories = await pgConnection("cms_blog_post")
      .where("is_published", true)
      .distinct("category")
      .pluck("category")

    return res.json({
      success: true,
      posts,
      categories: allCategories.filter(Boolean),
      count: posts.length,
    })
  } catch (error: any) {
    console.error("[Storefront CMS Blogs GET] Error:", error)
    return res.status(500).json({ success: false, message: error.message, posts: [], categories: [] })
  }
}
