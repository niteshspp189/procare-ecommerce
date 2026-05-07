import { model } from "@medusajs/framework/utils"

export const Ticket = model.define("ticket", {
  id: model.id({ prefix: "tick" }).primaryKey(),
  display_id: model.text(),
  customer_id: model.text(),
  order_id: model.text().nullable(),
  subject: model.text(),
  message: model.text(),
  status: model.enum(["open", "in_progress", "resolved"]).default("open"),
  admin_reply: model.text().nullable(),
})
