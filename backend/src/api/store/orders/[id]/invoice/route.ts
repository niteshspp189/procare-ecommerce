import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateInvoicePDF } from "../../../../../lib/email"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const query = req.scope.resolve("query")

  try {
    console.log(`[BackendInvoice] Fetching invoice for order ID: ${id}`)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "*",
        "shipping_address.*",
        "billing_address.*",
        "items.*",
        "items.item.*",
        "items.adjustments.*",
        "summary.*",
        "shipping_methods.*",
        "shipping_methods.adjustments.*",
        "payment_collections.*",
        "payment_collections.payments.*",
      ],
      filters: {
        id: [id]
      }
    })

    const order = orders?.[0]
    if (!order) {
      console.warn(`[BackendInvoice] Order not found: ${id}`)
      return res.status(404).json({ message: "Order not found" })
    }

    console.log(`[BackendInvoice] Generating PDF for order: ${order.display_id || order.id}`)
    const pdfBuffer = await generateInvoicePDF(order)
    console.log(`[BackendInvoice] PDF generated successfully, size: ${pdfBuffer.length} bytes`)

    const formattedId = `OD${(order.display_id || order.id || '0001').toString().padStart(8, '0')}`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${formattedId}.pdf`)
    
    return res.status(200).send(pdfBuffer)
  } catch (error: any) {
    console.error("[BackendInvoice] Failed to generate invoice:", error)
    return res.status(500).json({ message: `Failed to generate invoice: ${error.message}` })
  }
}
