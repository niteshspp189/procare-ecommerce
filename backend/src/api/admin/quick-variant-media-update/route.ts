import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any

  const body = req.body as {
    variant_id: string
    product_id: string
    image_urls: string[]
    metadata: Record<string, string>
  }

  if (!body.variant_id) {
    return res.status(400).json({ success: false, message: "variant_id is required" })
  }

  try {
    const { variant_id, product_id, image_urls = [], metadata = {} } = body

    // 1. Fetch current variant metadata and merge
    const varRows = await pgConnection("product_variant").select("metadata").where({ id: variant_id })
    const currentMeta = varRows[0]?.metadata || {}
    
    // Clear out old images so they don't persist if they were removed
    delete currentMeta['thumbnail']
    for (let i = 1; i <= 10; i++) {
      delete currentMeta[`image_${i}`]
    }
    
    const updatedMeta = { ...currentMeta, ...metadata }

    // Update variant metadata
    await pgConnection("product_variant")
      .where({ id: variant_id })
      .update({ metadata: JSON.stringify(updatedMeta) })

    // 2. Re-link images in product_variant_product_image
    await pgConnection("product_variant_product_image").where({ variant_id }).delete()

    for (let idx = 0; idx < image_urls.length; idx++) {
      const url = image_urls[idx]
      let imgRow = await pgConnection("image").select("id").where({ url }).first()
      if (!imgRow) {
        const newId = `img_var_${Date.now()}_${idx}`
        await pgConnection("image").insert({ 
          id: newId, 
          url, 
          product_id, // Required by DB constraint
          created_at: new Date(), 
          updated_at: new Date() 
        })
        imgRow = { id: newId }
      }
      await pgConnection("product_variant_product_image").insert({
        variant_id,
        image_id: imgRow.id,
        created_at: new Date(Date.now() + idx * 1000), // Space out by 1 sec to enforce sort order
        updated_at: new Date(Date.now() + idx * 1000)
      })
    }

    return res.json({ success: true, message: "Variant images updated successfully!" })
  } catch (err: any) {
    console.error("Error in quick-variant-media-update:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
