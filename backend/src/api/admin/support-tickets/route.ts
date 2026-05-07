import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPORT_MODULE } from "../../../modules/support"
import SupportModuleService from "../../../modules/support/service"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const service: SupportModuleService = req.scope.resolve(SUPPORT_MODULE)
  
  console.log("[SupportModule] ADMIN GET /admin/tickets")
  
  try {
    const tickets = await service.listTickets({}, {
      order: { created_at: "DESC" }
    })
    return res.status(200).json({ tickets })
  } catch (e: any) {
    console.error("[SupportModule] ADMIN Error listing tickets:", e)
    return res.status(500).json({ message: e.message })
  }
}
