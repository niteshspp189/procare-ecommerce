import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { generateInvoicePDF } from "../../../../../lib/email"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const orderModuleService: IOrderModuleService = req.scope.resolve(Modules.ORDER)

  try {
    console.log(`[BackendInvoice] Fetching invoice for order ID: ${id}`)
    const order = await orderModuleService.retrieveOrder(id, {
      relations: ["shipping_address", "items", "billing_address"]
    })

    if (!order) {
      console.warn(`[BackendInvoice] Order not found: ${id}`)
      return res.status(404).json({ message: "Order not found" })
    }

    console.log(`[BackendInvoice] Generating PDF for order: ${order.display_id || order.id}`)
    const pdfBuffer = await generateInvoicePDF(order)
    console.log(`[BackendInvoice] PDF generated successfully, size: ${pdfBuffer.length} bytes`)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${order.display_id || order.id}.pdf`)
    
    return res.status(200).send(pdfBuffer)
  } catch (error: any) {
    console.error("[BackendInvoice] Failed to generate invoice:", error)
    return res.status(500).json({ message: `Failed to generate invoice: ${error.message}` })
  }
}
