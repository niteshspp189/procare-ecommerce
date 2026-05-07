import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPORT_MODULE } from "../../../../modules/support"
import SupportModuleService from "../../../../modules/support/service"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params
  const service: SupportModuleService = req.scope.resolve(SUPPORT_MODULE)
  
  console.log(`[SupportModule] ADMIN POST /admin/tickets/${id}`)
  console.log("[SupportModule] Body:", req.body)

  const { status, admin_reply } = req.body as any

  const updateData: any = { id }
  if (status) updateData.status = status
  if (admin_reply) updateData.admin_reply = admin_reply

  try {
    const ticket = await service.updateTickets(updateData)
    console.log("[SupportModule] Ticket updated")
    return res.status(200).json({ ticket })
  } catch (e: any) {
    console.error("[SupportModule] ADMIN Error updating ticket:", e)
    return res.status(500).json({ message: e.message })
  }
}
