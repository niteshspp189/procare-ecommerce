import { NextRequest, NextResponse } from "next/server"

function escapeXml(unsafe: string): string {
  if (!unsafe) return ""
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export const dynamic = "force-dynamic"
export const revalidate = 3600 // Cache for 1 hour

export async function GET(request: NextRequest) {
  const backendUrl =
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "https://propremiumcare.com/store-backend"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  const baseUrl = "https://propremiumcare.com"

  try {
    const res = await fetch(
      `${backendUrl}/store/products?limit=250&fields=*variants.calculated_price,+variants.inventory_quantity,*variants.images,*images,*options,*type,+metadata,+tags`,
      {
        headers: {
          "x-publishable-api-key": publishableKey,
        },
        cache: "no-store",
      }
    )

    if (!res.ok) {
      throw new Error(`Failed to fetch products from backend: ${res.statusText}`)
    }

    const data = await res.json()
    const products: any[] = data.products || []

    let xmlItems = ""

    for (const p of products) {
      if (!p || !p.handle) continue

      const title = escapeXml(p.title || "PRO Premium Care Product")
      const description = escapeXml(
        p.description ||
          (p.metadata?.key_benefits ? String(p.metadata.key_benefits).replace(/\*\*/g, "") : title)
      )
      const link = `${baseUrl}/products/${p.handle}`

      // Raw thumbnail or main image
      let rawImage = p.thumbnail || (p.images && p.images[0]?.url) || "/images/polish.jpeg"
      if (rawImage && !rawImage.startsWith("http")) {
        rawImage = `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`
      }
      const imageLink = escapeXml(rawImage)

      const variants = p.variants && p.variants.length > 0 ? p.variants : [null]

      for (const v of variants) {
        const itemId = escapeXml(v?.id || p.id)
        const variantTitle = v && v.title && !v.title.toLowerCase().includes("default")
          ? `${p.title} - ${v.title}`
          : p.title
        const itemTitle = escapeXml(variantTitle)

        // Price formatting
        let priceNumber = 0
        if (v && v.calculated_price && typeof v.calculated_price.calculated_amount === "number") {
          priceNumber = v.calculated_price.calculated_amount
        } else if (v && v.metadata && v.metadata.sellingPrice) {
          priceNumber = parseFloat(v.metadata.sellingPrice) || 0
        } else if (v && v.metadata && v.metadata.mrp) {
          priceNumber = parseFloat(v.metadata.mrp) || 0
        }

        if (!priceNumber || priceNumber <= 0) {
          priceNumber = 199.0 // Default fallback price if non-numeric
        }

        const formattedPrice = `${priceNumber.toFixed(2)} INR`

        let vRawImage = (v && v.metadata?.image_1) || rawImage
        if (vRawImage && !vRawImage.startsWith("http")) {
          vRawImage = `${baseUrl}${vRawImage.startsWith("/") ? "" : "/"}${vRawImage}`
        }
        const vImageLink = escapeXml(vRawImage)

        xmlItems += `
    <item>
      <g:id>${itemId}</g:id>
      <g:title>${itemTitle}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}${v && v.id ? `?v_id=${v.id}` : ""}</g:link>
      <g:image_link>${vImageLink}</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>${formattedPrice}</g:price>
      <g:condition>new</g:condition>
      <g:brand>PRO Premium Care</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Shoe Care &amp; Repair</g:google_product_category>
    </item>`
      }
    }

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>PRO Premium Care Product Catalog</title>
    <link>${baseUrl}</link>
    <description>Google Merchant Center XML Feed for PRO Premium Care</description>${xmlItems}
  </channel>
</rss>`

    return new NextResponse(xmlFeed, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error: any) {
    console.error("GMC Feed Generation Error:", error)
    return new NextResponse(`Error generating XML feed: ${error.message}`, { status: 500 })
  }
}
