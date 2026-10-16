import { sdk } from "@lib/config"

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content: string
  category: string
  featured_image?: string | null
  author: string
  read_time: string
  published_at?: string
  created_at?: string
}

export const getBlogPosts = async (
  category?: string
): Promise<{ posts: BlogPost[]; categories: string[] }> => {
  const url =
    category && category !== "all"
      ? `/store/custom/blogs?category=${encodeURIComponent(category)}`
      : `/store/custom/blogs`

  return sdk.client
    .fetch<{ success: boolean; posts: BlogPost[]; categories: string[] }>(url, {
      method: "GET",
      next: {
        revalidate: 60,
        tags: ["blogs"],
      },
    })
    .then((res) => {
      if (res && res.success) {
        return { posts: res.posts || [], categories: res.categories || [] }
      }
      return { posts: [], categories: [] }
    })
    .catch((e) => {
      console.error("Failed to fetch blog posts", e)
      return { posts: [], categories: [] }
    })
}

export const getBlogPostBySlug = async (
  slug: string
): Promise<{ post: BlogPost | null; relatedPosts: BlogPost[] }> => {
  return sdk.client
    .fetch<{ success: boolean; post: BlogPost; relatedPosts: BlogPost[] }>(
      `/store/custom/blogs/${encodeURIComponent(slug)}`,
      {
        method: "GET",
        next: {
          revalidate: 60,
          tags: ["blogs", `blog-${slug}`],
        },
      }
    )
    .then((res) => {
      if (res && res.success && res.post) {
        return { post: res.post, relatedPosts: res.relatedPosts || [] }
      }
      return { post: null, relatedPosts: [] }
    })
    .catch((e) => {
      console.error("Failed to fetch blog post by slug", e)
      return { post: null, relatedPosts: [] }
    })
}
