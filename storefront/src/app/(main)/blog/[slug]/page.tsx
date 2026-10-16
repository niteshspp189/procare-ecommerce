import React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getBlogPostBySlug } from "@lib/data/blogs"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const { post } = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: "Article Not Found | PRO Care",
    }
  }

  return {
    title: `${post.title} | PRO Care Guide`,
    description: post.excerpt || `Read ${post.title} on the official PRO Care shoe care journal.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image ? [{ url: post.featured_image }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { post, relatedPosts } = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Simple Markdown-to-HTML parser for standard elements (## headings, > blockquotes, bullet lists, paragraphs)
  const renderContent = (content: string) => {
    const blocks = content.split("\n\n")

    return blocks.map((block, idx) => {
      const trimmed = block.trim()

      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-10 mb-4 tracking-tight">
            {trimmed.replace("## ", "")}
          </h2>
        )
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-3">
            {trimmed.replace("### ", "")}
          </h3>
        )
      }

      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-[#00b5a4] bg-[#00b5a4]/5 p-4 my-6 rounded-r-lg text-gray-800 italic font-medium">
            {trimmed.replace("> ", "")}
          </blockquote>
        )
      }

      if (trimmed.startsWith("---")) {
        return <hr key={idx} className="my-8 border-gray-200" />
      }

      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const items = trimmed.split("\n")
        return (
          <ul key={idx} className="list-disc list-inside space-y-2 my-4 text-gray-700 leading-relaxed pl-2">
            {items.map((it, i) => (
              <li key={i} className="pl-1">
                {it.replace(/^[\*\-]\s+/, "")}
              </li>
            ))}
          </ul>
        )
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n")
        return (
          <ol key={idx} className="list-decimal list-inside space-y-2 my-4 text-gray-700 leading-relaxed pl-2">
            {items.map((it, i) => (
              <li key={i} className="pl-1 font-medium text-gray-800">
                <span className="font-normal text-gray-700">{it.replace(/^\d+\.\s+/, "")}</span>
              </li>
            ))}
          </ol>
        )
      }

      return (
        <p key={idx} className="text-base sm:text-lg text-gray-700 leading-relaxed my-4">
          {trimmed}
        </p>
      )
    })
  }

  return (
    <article className="w-full bg-white min-h-screen py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium">
          <LocalizedClientLink href="/" className="hover:text-black transition-colors">
            Home
          </LocalizedClientLink>
          <span>/</span>
          <LocalizedClientLink href="/blog" className="hover:text-black transition-colors">
            Blog
          </LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-black text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              {post.category || "Care Guide"}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {post.read_time || "4 min read"}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">
              {post.published_at ? new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "PRO Care"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-6 font-normal">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              PC
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{post.author || "PRO Care Editorial"}</p>
              <p className="text-xs text-gray-500">Footwear Care Specialists</p>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden mb-12 bg-gray-100 shadow-md">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="prose max-w-none text-gray-800 text-base sm:text-lg leading-relaxed">
          {renderContent(post.content)}
        </div>

        {/* Bottom CTA Box */}
        <div className="my-14 p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-black text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Upgrade Your Shoe Care Kit</h3>
            <p className="text-sm text-gray-300 max-w-md">
              Discover our range of German & European formulated creams, natural brushes, and protectors.
            </p>
          </div>
          <LocalizedClientLink
            href="/shop"
            className="px-6 py-3.5 rounded-full bg-[#00b5a4] text-white font-bold text-sm hover:bg-[#009b8d] transition-all whitespace-nowrap shadow-lg"
          >
            Shop Shoe Care Range →
          </LocalizedClientLink>
        </div>

        {/* Related Articles */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">More Guides from PRO Care</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <LocalizedClientLink
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group flex flex-col bg-gray-50 hover:bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all p-4"
                >
                  <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-gray-200 mb-3">
                    <img
                      src={rel.featured_image || "/images/landing-page-images/cat-shoecare-new.webp"}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00b5a4] mb-1">
                    {rel.category}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-neutral-700 line-clamp-2 mb-2">
                    {rel.title}
                  </h3>
                  <span className="text-xs text-gray-500 mt-auto">{rel.read_time}</span>
                </LocalizedClientLink>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
