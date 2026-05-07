import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  
  // Forward the request to Medusa backend with cookies for auth
  const response = await fetch(`${medusaUrl}/store/support-tickets`, {
    method: "GET",
    headers: {
      "Cookie": req.headers.get("cookie") || "",
      "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    },
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
