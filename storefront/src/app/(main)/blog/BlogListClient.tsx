"use client"

import React, { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BlogPost } from "@lib/data/blogs"

interface BlogListClientProps {
  initialPosts: BlogPost[]
  categories: string[]
}

export default function BlogListClient({ initialPosts, categories }: BlogListClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const filteredPosts =
    selectedCategory === "all"
      ? initialPosts
      : initialPosts.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className="w-full">
      {/* Category Filter Pills (Only shown when multiple categories exist) */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-black text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Guides ({initialPosts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-black text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat} ({initialPosts.filter((p) => p.category?.toLowerCase() === cat.toLowerCase()).length})
            </button>
          ))}
        </div>
      )}

      {/* Articles Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-xs max-w-xl mx-auto p-8">
          <div className="w-12 h-12 bg-[#00b5a4]/10 text-[#00b5a4] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">New Articles Coming Soon</h3>
          <p className="text-sm text-gray-500">We are curating expert shoe care tips and stories. Stay tuned for our upcoming publications!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Card Image */}
              <LocalizedClientLink href={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={post.featured_image || "/images/landing-page-images/cat-shoecare-new.webp"}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {post.category && (
                  <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-xs text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {post.category}
                  </span>
                )}
              </LocalizedClientLink>

              {/* Card Content */}
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 font-medium">
                  <span>{post.read_time || "4 min read"}</span>
                  <span>•</span>
                  <span>{post.author || "PRO Care"}</span>
                </div>

                <h2 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-neutral-700 transition-colors line-clamp-2 mb-3">
                  <LocalizedClientLink href={`/blog/${post.slug}`}>
                    {post.title}
                  </LocalizedClientLink>
                </h2>

                <p className="text-sm text-gray-600 line-clamp-3 mb-5 flex-1 leading-relaxed">
                  {post.excerpt}
                </p>

                <LocalizedClientLink
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-black group-hover:gap-2 transition-all"
                >
                  Read Guide <span>→</span>
                </LocalizedClientLink>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
