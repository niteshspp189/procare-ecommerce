import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://procare_backend:9000"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json({ products: [] }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      }
    })
  }

  try {
    const url = new URL(`${BACKEND_URL}/store/products`)
    url.searchParams.set("limit", "100")
    url.searchParams.set("fields", "id,title,handle,thumbnail,description,*variants")

    const res = await fetch(url.toString(), {
      headers: {
        "x-publishable-api-key": PUB_KEY,
        "content-type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error(`Search backend returned status ${res.status}`)
      return NextResponse.json({ products: [] }, {
        headers: { "Cache-Control": "no-store, max-age=0" }
      })
    }

    const data = await res.json()
    const queryLower = q.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim()
    const queryWords = queryLower.split(/\s+/).filter(Boolean)
    const expandedResults: any[] = []

    const matchedProducts = (data.products || []).filter((prod: any) => {
      const titleLower = (prod.title || "").toLowerCase()
      const descLower = (prod.description || "").toLowerCase()
      const handleLower = (prod.handle || "").toLowerCase()

      // Check if all words in query appear somewhere in title, desc, or handle
      return queryWords.every((word) => {
        return (
          titleLower.includes(word) ||
          descLower.includes(word) ||
          handleLower.includes(word)
        )
      })
    })

    for (const prod of matchedProducts) {
      if (prod.variants && prod.variants.length > 1) {
        // If query is broad, show the variants that match best, or show all
        const matchingVariants = prod.variants.filter((v: any) => {
          const vTitle = (v.title || "").toLowerCase()
          return queryWords.some((word) => vTitle.includes(word))
        })
        const variantsToShow = matchingVariants.length > 0 ? matchingVariants : prod.variants

        for (const v of variantsToShow) {
          const vTitle = (v.title || "").toLowerCase()
          if (vTitle === "default" || vTitle === "standard" || !v.title) {
            expandedResults.push({
              id: prod.id,
              title: prod.title,
              handle: prod.handle,
              thumbnail: prod.thumbnail,
            })
            break
          }
          const meta = (v.metadata || {}) as Record<string, string>
          const vThumb = meta.image_1 || prod.thumbnail
          expandedResults.push({
            id: `${prod.id}_${v.id}`,
            variant_id: v.id,
            title: `${prod.title} (${v.title})`,
            handle: prod.handle,
            thumbnail: vThumb,
          })
        }
      } else {
        expandedResults.push({
          id: prod.id,
          title: prod.title,
          handle: prod.handle,
          thumbnail: prod.thumbnail,
        })
      }
    }

    return NextResponse.json(
      { products: expandedResults },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        },
      }
    )
  } catch (error: any) {
    console.error("Search API error:", error)
    return NextResponse.json(
      { products: [] },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  }
}
