import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://procare_backend:9000"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json({ products: [] })
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
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return NextResponse.json({ products: [] })
    }

    const data = await res.json()
    const queryLower = q.toLowerCase().replace(/[^a-z0-9\s]/g, "")
    const queryWords = queryLower.split(/\s+/).filter(Boolean)
    const expandedResults: any[] = []

    const matchedProducts = (data.products || []).filter((prod: any) => {
      const titleLower = (prod.title || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "")
      const descLower = (prod.description || "").toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "")
      const handleLower = (prod.handle || "").toLowerCase().replace(/[^a-z0-9]/g, "")

      return queryWords.every(word => {
        const cleanWord = word.replace(/\s+/g, "")
        return titleLower.includes(cleanWord) || 
               descLower.includes(cleanWord) || 
               handleLower.includes(cleanWord)
      })
    })

    for (const prod of matchedProducts) {
      if (prod.variants && prod.variants.length > 1) {
        // If query is broad, show the variants that match best, or show all
        const matchingVariants = prod.variants.filter((v: any) => {
          const vTitle = (v.title || '').toLowerCase().replace(/[^a-z0-9]/g, "")
          return queryWords.some(word => vTitle.includes(word.replace(/\s+/g, "")))
        })
        const variantsToShow = matchingVariants.length > 0 ? matchingVariants : prod.variants

        for (const v of variantsToShow) {
          const vTitle = (v.title || '').toLowerCase()
          if (vTitle === 'default' || vTitle === 'standard' || !v.title) {
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

    return NextResponse.json({ products: expandedResults })
  } catch {
    return NextResponse.json({ products: [] })
  }
}
