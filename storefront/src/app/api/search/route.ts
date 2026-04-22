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
    url.searchParams.set("limit", "6")
    url.searchParams.set("fields", "id,title,handle,thumbnail")

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
    return NextResponse.json({ products: data.products || [] })
  } catch {
    return NextResponse.json({ products: [] })
  }
}
