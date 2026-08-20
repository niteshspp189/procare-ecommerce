import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    revalidateTag("products")
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err: any) {
    return NextResponse.json({ revalidated: false, message: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    revalidateTag("products")
    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (err: any) {
    return NextResponse.json({ revalidated: false, message: err.message }, { status: 500 })
  }
}
