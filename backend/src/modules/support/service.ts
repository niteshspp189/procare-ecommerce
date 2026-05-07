import { MedusaService } from "@medusajs/framework/utils"
import { Ticket } from "./models/ticket"

class SupportModuleService extends MedusaService({
  Ticket,
}) {
}

export default SupportModuleService
