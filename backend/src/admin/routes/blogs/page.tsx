import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Badge,
  Input,
  Label,
  Textarea,
  toast,
} from "@medusajs/ui"
import {
  BookOpen,
  ArrowPath,
  PencilSquare,
  Trash,
  Plus,
  ArrowUpRightOnBox,
} from "@medusajs/icons"
import { useState, useEffect } from "react"

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content: string
  category: string
  featured_image?: string | null
  author: string
  read_time: string
  is_published: boolean
  display_order: number
  published_at?: string
  created_at?: string
  updated_at?: string
}

const BlogsCMSPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all")

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [formTitle, setFormTitle] = useState("")
  const [formSlug, setFormSlug] = useState("")
  const [formCategory, setFormCategory] = useState("Shoe Care")
  const [formExcerpt, setFormExcerpt] = useState("")
  const [formFeaturedImage, setFormFeaturedImage] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formAuthor, setFormAuthor] = useState("PRO Care Editorial")
  const [formReadTime, setFormReadTime] = useState("4 min read")
  const [formIsPublished, setFormIsPublished] = useState(true)

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/admin/custom/blogs", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts || [])
      } else {
        toast.error(data.message || "Failed to load blog posts")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Network error loading blog posts")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleOpenAdd = () => {
    setEditingPost(null)
    setFormTitle("")
    setFormSlug("")
    setFormCategory("Shoe Care")
    setFormExcerpt("")
    setFormFeaturedImage("")
    setFormContent("")
    setFormAuthor("PRO Care Editorial")
    setFormReadTime("4 min read")
    setFormIsPublished(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormTitle(post.title)
    setFormSlug(post.slug)
    setFormCategory(post.category || "General")
    setFormExcerpt(post.excerpt || "")
    setFormFeaturedImage(post.featured_image || "")
    setFormContent(post.content || "")
    setFormAuthor(post.author || "PRO Care Editorial")
    setFormReadTime(post.read_time || "4 min read")
    setFormIsPublished(post.is_published)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      const res = await fetch(`/admin/custom/blogs/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Blog post deleted")
        await fetchPosts()
      } else {
        toast.error(data.message || "Failed to delete blog post")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Network error deleting post")
    }
  }

  const handleTitleChange = (val: string) => {
    setFormTitle(val)
    if (!editingPost) {
      // Auto-generate clean slug
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
      setFormSlug(generatedSlug)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast.error("Article Title is required")
      return
    }
    if (!formContent.trim()) {
      toast.error("Article Content is required")
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: formTitle.trim(),
        slug: formSlug.trim() || undefined,
        category: formCategory.trim() || "General",
        excerpt: formExcerpt.trim() || null,
        featured_image: formFeaturedImage.trim() || null,
        content: formContent.trim(),
        author: formAuthor.trim() || "PRO Care Editorial",
        read_time: formReadTime.trim() || "4 min read",
        is_published: formIsPublished,
      }

      let res
      if (editingPost) {
        res = await fetch(`/admin/custom/blogs/${editingPost.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      } else {
        res = await fetch("/admin/custom/blogs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })
      }

      const data = await res.json()
      if (data.success) {
        toast.success(editingPost ? "Article updated successfully" : "Article published successfully")
        setIsModalOpen(false)
        await fetchPosts()
      } else {
        toast.error(data.message || "Failed to save article")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Network error saving article")
    } finally {
      setIsSaving(false)
    }
  }

  // Categories list
  const uniqueCategories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))
  const filteredPosts = posts.filter(
    (p) => activeCategoryTab === "all" || p.category === activeCategoryTab
  )

  return (
    <div className="flex flex-col gap-y-6 pb-12">
      {/* Header Container */}
      <Container className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <BookOpen className="w-6 h-6 text-ui-fg-base" />
              <Heading level="h1" className="text-xl font-bold">
                Blog & Editorial Guides
              </Heading>
            </div>
            <Text className="text-ui-fg-muted text-sm">
              Manage educational shoe care guides, style tips, and maintenance articles for the `/blog` storefront page.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={fetchPosts}
              className="flex items-center gap-1.5"
            >
              <ArrowPath className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              + Write New Article
            </Button>
          </div>
        </div>
      </Container>

      {/* Posts Table */}
      <Container className="p-0 overflow-hidden">
        <div className="p-4 border-b border-ui-border-base flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Heading level="h2" className="text-base font-semibold">
            All Articles ({filteredPosts.length})
          </Heading>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveCategoryTab("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeCategoryTab === "all"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({posts.length})
            </button>
            {uniqueCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryTab(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  activeCategoryTab === cat
                    ? "bg-white text-gray-900 shadow-2xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {cat} ({posts.filter((p) => p.category === cat).length})
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Article</Table.HeaderCell>
                <Table.HeaderCell>Category</Table.HeaderCell>
                <Table.HeaderCell>Author & Time</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <Table.Cell className="text-center py-12 text-ui-fg-muted">
                    Loading articles...
                  </Table.Cell>
                </Table.Row>
              ) : filteredPosts.length === 0 ? (
                <Table.Row>
                  <Table.Cell className="text-center py-12 text-ui-fg-muted">
                    No articles found in this category.
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredPosts.map((post) => (
                  <Table.Row key={post.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-14 h-10 object-cover rounded border border-gray-200 bg-gray-50 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 text-xs shrink-0">
                            No Img
                          </div>
                        )}
                        <div>
                          <Text className="font-semibold text-sm text-ui-fg-base">{post.title}</Text>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-ui-fg-muted truncate max-w-[260px]">
                              /blog/{post.slug}
                            </span>
                            <a
                              href={`https://propremiumcare.com/blog/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-gray-700"
                            >
                              <ArrowUpRightOnBox className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge size="small" color="grey" className="font-medium text-xs">
                        {post.category || "General"}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <Text className="text-xs text-ui-fg-base font-medium">{post.author}</Text>
                      <Text className="text-[11px] text-ui-fg-muted">{post.read_time}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      {post.is_published ? (
                        <Badge size="small" color="green">
                          Published
                        </Badge>
                      ) : (
                        <Badge size="small" color="orange">
                          Draft
                        </Badge>
                      )}
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleOpenEdit(post)}
                          className="inline-flex items-center gap-1 font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-800"
                        >
                          <PencilSquare className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDelete(post.id, post.title)}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </Container>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <Heading level="h2" className="text-lg font-bold text-gray-900">
                  {editingPost ? `Edit Article: ${editingPost.title}` : `+ Write New Article`}
                </Heading>
                <Text className="text-xs text-gray-500">
                  Fill in article details, markdown content, and featured image.
                </Text>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-700 block mb-1">Article Title *</Label>
                <Input
                  placeholder="e.g. How to Clean and Condition Leather Shoes"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">URL Slug</Label>
                  <Input
                    placeholder="how-to-clean-and-condition-leather-shoes"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Category</Label>
                  <div className="flex gap-2">
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white text-gray-800 rounded-md border border-gray-300"
                    >
                      <option value="Shoe Care">Shoe Care</option>
                      <option value="Sneaker Care">Sneaker Care</option>
                      <option value="Leather Care">Leather Care</option>
                      <option value="Foot Care & Insoles">Foot Care & Insoles</option>
                      <option value="Style & Guides">Style & Guides</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Author</Label>
                  <Input
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Read Time</Label>
                  <Input
                    value={formReadTime}
                    onChange={(e) => setFormReadTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 block mb-1">Visibility</Label>
                  <select
                    value={formIsPublished ? "published" : "draft"}
                    onChange={(e) => setFormIsPublished(e.target.value === "published")}
                    className="w-full h-8 px-2 text-xs bg-white text-gray-800 rounded-md border border-gray-300"
                  >
                    <option value="published">🟢 Published (Visible on Store)</option>
                    <option value="draft">🟡 Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 block mb-1">Featured Image URL</Label>
                <Input
                  placeholder="/images/landing-page-images/cat-shoecare-new.webp"
                  value={formFeaturedImage}
                  onChange={(e) => setFormFeaturedImage(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700 block mb-1">Short Excerpt (Summary)</Label>
                <Textarea
                  placeholder="A brief 1-2 sentence overview for cards and Google SEO meta tags..."
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold text-gray-700">Article Content (Markdown supported) *</Label>
                  <span className="text-[11px] text-gray-400">Supports ## Headings, lists, bold text, blockquotes</span>
                </div>
                <Textarea
                  placeholder="Write your article content here in markdown format..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between -mx-6 -mb-6 mt-6 rounded-b-xl shadow-lg z-10">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSaving} className="bg-black text-white hover:bg-gray-800">
                  {editingPost ? "Save Changes" : "Publish Article"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Blog CMS",
  icon: BookOpen,
})

export default BlogsCMSPage
