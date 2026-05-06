import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { generateInvoicePDF } from "../../../../lib/email"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const orderModuleService: IOrderModuleService = req.scope.resolve(Modules.ORDER)

  try {
    const order = await orderModuleService.retrieveOrder(id, {
      relations: ["shipping_address", "items", "billing_address"]
    })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    const pdfBuffer = await generateInvoicePDF(order)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=Invoice_${order.display_id || order.id}.pdf`)
    
    return res.status(200).send(pdfBuffer)
  } catch (error) {
    console.error("[InvoiceAPI] Failed to generate invoice:", error)
    return res.status(500).json({ message: "Failed to generate invoice" })
  }
}
