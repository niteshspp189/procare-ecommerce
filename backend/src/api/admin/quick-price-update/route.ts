import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { variant_id, mrp, selling_price } = req.body as {
    variant_id: string
    mrp?: number | string
    selling_price?: number | string
  }

  if (!variant_id) {
    return res.status(400).json({ message: "variant_id is required" })
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    const pvps = await pgConnection("product_variant_price_set")
      .where({ variant_id })
      .first()

    if (!pvps) {
      return res.status(404).json({ message: "Price set not found for variant" })
    }

    const price_set_id = pvps.price_set_id

    // Update or Insert MRP (price_list_id is NULL)
    if (mrp !== undefined && mrp !== null && mrp !== "") {
      const numMrp = floatVal(mrp)
      const existingMrp = await pgConnection("price")
        .where({ price_set_id, currency_code: "inr" })
        .whereNull("price_list_id")
        .first()

      if (existingMrp) {
        await pgConnection("price")
          .where({ id: existingMrp.id })
          .update({
            raw_amount: JSON.stringify({ value: String(numMrp), precision: 20 }),
            updated_at: new Date()
          })
      } else {
        const id = `price_${Math.random().toString(36).substring(2, 15)}`
        await pgConnection("price").insert({
          id,
          price_set_id,
          currency_code: "inr",
          price_list_id: null,
          raw_amount: JSON.stringify({ value: String(numMrp), precision: 20 }),
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    }

    // Update or Insert Selling Price (price_list_id = 'pl_online_sale')
    if (selling_price !== undefined && selling_price !== null && selling_price !== "") {
      const numSelling = floatVal(selling_price)
      const existingSelling = await pgConnection("price")
        .where({ price_set_id, currency_code: "inr", price_list_id: "pl_online_sale" })
        .first()

      if (existingSelling) {
        await pgConnection("price")
          .where({ id: existingSelling.id })
          .update({
            raw_amount: JSON.stringify({ value: String(numSelling), precision: 20 }),
            updated_at: new Date()
          })
      } else {
        const id = `price_${Math.random().toString(36).substring(2, 15)}`
        await pgConnection("price").insert({
          id,
          price_set_id,
          currency_code: "inr",
          price_list_id: "pl_online_sale",
          raw_amount: JSON.stringify({ value: String(numSelling), precision: 20 }),
          created_at: new Date(),
          updated_at: new Date()
        })
      }
    }

    return res.json({ success: true, message: "Prices updated successfully" })
  } catch (error: any) {
    console.error("Quick price update error:", error)
    return res.status(500).json({ message: error.message || "Failed to update prices" })
  }
}

function floatVal(val: any): number {
  if (typeof val === "number") return val
  const p = parseFloat(String(val).replace(/[^0-9.]/g, ""))
  return isNaN(p) ? 0 : p
}
