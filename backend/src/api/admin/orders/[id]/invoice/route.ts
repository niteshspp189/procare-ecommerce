import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateInvoicePDF } from "../../../../../lib/email"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const query = req.scope.resolve("query")
  
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "*",
      "shipping_address.*",
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

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: "Order not found" })
  }

  const order = orders[0]

  try {
    const pdfBuffer = await generateInvoicePDF(order)
    
    const formattedId = `OD${(order.display_id || order.id || '0001').toString().padStart(8, '0')}`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="Invoice_${formattedId}.pdf"`)
    res.send(pdfBuffer)
  } catch (err: any) {
    console.error("Error generating invoice PDF:", err)
    res.status(500).json({ message: err.message })
  }
}
