import React from "react"
import { Metadata } from "next"
import { getBlogPosts } from "@lib/data/blogs"
import BlogListClient from "./BlogListClient"

export const metadata: Metadata = {
  title: "Shoe & Leather Care Guides, Tips & Maintenance | PRO Care Blog",
  description:
    "Explore expert shoe care advice, leather nourishment techniques, sneaker cleaning routines, and foot comfort guides from PRO Care specialists.",
  keywords: [
    "shoe care guide",
    "how to clean leather shoes",
    "sneaker cleaning tips",
    "suede restoration",
    "pro shoe care blog",
  ],
}

export default async function BlogPage() {
  const { posts, categories } = await getBlogPosts()

  return (
    <div className="w-full bg-[#fafafa] min-h-screen py-10 md:py-16">
      <div className="content-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#00b5a4] bg-[#00b5a4]/10 px-3.5 py-1.5 rounded-full inline-block mb-3">
            News & Articles
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Latest Blogs
          </h1>
        </div>

        {/* Client Interactive Filter & Grid */}
        <BlogListClient initialPosts={posts} categories={categories} />
      </div>
    </div>
  )
}
