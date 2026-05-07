import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = await params
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  try {
    const response = await fetch(`${backendUrl}/store/orders/${orderId}/invoice`, {
      method: "GET",
      headers: {
        "x-publishable-api-key": publishableKey || "",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new NextResponse(`Failed to fetch invoice: ${errorText}`, { status: response.status })
    }

    const blob = await response.blob()
    const headers = new Headers()
    headers.set("Content-Type", "application/pdf")
    headers.set("Content-Disposition", `attachment; filename="invoice-${orderId}.pdf"`)

    return new NextResponse(blob, {
      status: 200,
      headers,
    })
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message}`, { status: 500 })
  }
}
