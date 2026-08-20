import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { product_id, metadata } = req.body as {
    product_id: string
    metadata: Record<string, any>
  }

  if (!product_id || !metadata) {
    return res.status(400).json({ message: "product_id and metadata are required" })
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    const existing = await pgConnection("product")
      .where({ id: product_id })
      .first()

    if (!existing) {
      return res.status(404).json({ message: "Product not found" })
    }

    const currentMeta = typeof existing.metadata === "string"
      ? JSON.parse(existing.metadata)
      : (existing.metadata || {})

    const updatedMeta = {
      ...currentMeta,
      ...metadata,
    }

    await pgConnection("product")
      .where({ id: product_id })
      .update({
        metadata: JSON.stringify(updatedMeta),
        updated_at: new Date(),
      })

    // Trigger storefront cache revalidation
    try {
      const storeUrl = process.env.STORE_CORS?.split(",")[0] || "http://localhost:8000"
      await fetch(`${storeUrl}/api/revalidate`, { method: "POST" })
    } catch (e) {
      console.error("Failed to revalidate storefront cache", e)
    }

    return res.json({ success: true, message: "Metadata updated successfully", metadata: updatedMeta })
  } catch (error: any) {
    console.error("Quick meta update error:", error)
    return res.status(500).json({ message: error.message || "Failed to update metadata" })
  }
}
