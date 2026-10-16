import seoData from "@lib/constants/seo-meta-tags.json"
import { Metadata } from "next"

export interface SeoEntry {
  title: string
  description: string
  keywords: string
  url: string
}

export function getSeoForPath(pathname: string): SeoEntry | undefined {
  return (seoData.paths as Record<string, SeoEntry>)[pathname]
}

export function getSeoForProduct(handle: string): SeoEntry | undefined {
  return (seoData.products as Record<string, SeoEntry>)[handle]
}

export function getSeoForCategory(handle: string): SeoEntry | undefined {
  return (seoData.categories as Record<string, SeoEntry>)[handle]
}

export function buildSeoMetadata({
  title,
  description,
  keywords,
  fallbackTitle,
  fallbackDescription,
  image,
}: {
  title?: string
  description?: string
  keywords?: string
  fallbackTitle: string
  fallbackDescription: string
  image?: string
}): Metadata {
  const finalTitle = title || fallbackTitle
  const finalDesc = description || fallbackDescription

  return {
    title: finalTitle,
    description: finalDesc,
    keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    openGraph: {
      title: finalTitle,
      description: finalDesc,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDesc,
      images: image ? [image] : [],
    },
  }
}
