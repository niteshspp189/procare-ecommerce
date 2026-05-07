import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = await params
  const backendUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  try {
    console.log(`[StorefrontAPI] Fetching invoice for order: ${orderId} from ${backendUrl}`)
    const response = await fetch(`${backendUrl}/store/orders/${orderId}/invoice`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": publishableKey || "",
      },
    })

    console.log(`[StorefrontAPI] Backend response status: ${response.status}`)
    console.log(`[StorefrontAPI] Backend response headers:`, Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[StorefrontAPI] Backend error: ${errorText}`)
      return new NextResponse(`Failed to fetch invoice: ${errorText}`, { status: response.status })
    }

    const blob = await response.blob()
    console.log(`[StorefrontAPI] Received blob size: ${blob.size} bytes, type: ${blob.type}`)

    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="invoice-${orderId}.pdf"`)

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    console.error(`[StorefrontAPI] Proxy error: ${error.message}`)
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
