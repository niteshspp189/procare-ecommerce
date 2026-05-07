import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPORT_MODULE } from "../../../modules/support"
import SupportModuleService from "../../../modules/support/service"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const service: SupportModuleService = req.scope.resolve(SUPPORT_MODULE)
  const customerId = (req as any).auth_context?.actor_id
  
  console.log("[SupportModule] POST /store/tickets - customerId:", customerId)
  console.log("[SupportModule] Body:", req.body)

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { subject, message, order_id } = req.body as any

  try {
    const ticket = await service.createTickets({
      customer_id: customerId,
      display_id: `TICK-${Math.floor(Math.random() * 900000) + 100000}`,
      subject,
      message,
      order_id,
      status: "open",
    })
    console.log("[SupportModule] Ticket created:", ticket.id)
    return res.status(200).json({ ticket })
  } catch (e: any) {
    console.error("[SupportModule] Error creating ticket:", e)
    return res.status(500).json({ message: e.message })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const service: SupportModuleService = req.scope.resolve(SUPPORT_MODULE)
  const customerId = (req as any).auth_context?.actor_id
  
  console.log("[SupportModule] GET /store/tickets - customerId:", customerId)

  if (!customerId) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  try {
    const tickets = await service.listTickets({
      customer_id: customerId,
    }, {
      order: { created_at: "DESC" }
    })
    return res.status(200).json({ tickets })
  } catch (e: any) {
    console.error("[SupportModule] Error listing tickets:", e)
    return res.status(500).json({ message: e.message })
  }
}
