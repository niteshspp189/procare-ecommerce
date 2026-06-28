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
    url.searchParams.set("q", q)
    url.searchParams.set("limit", "20")
    url.searchParams.set("fields", "id,title,handle,thumbnail,*variants")

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
    const queryLower = q.toLowerCase()
    const expandedResults: any[] = []

    for (const prod of (data.products || [])) {
      if (prod.variants && prod.variants.length > 1) {
        const matchingVariants = prod.variants.filter((v: any) =>
          v.title?.toLowerCase().includes(queryLower)
        )
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
