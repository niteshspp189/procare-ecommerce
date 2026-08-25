import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DEFAULT_ANNOUNCEMENTS } from "../../../store/custom/announcements/route"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const store = await pgConnection("store").select("id", "metadata").first()

    let announcements: string[] = []
    if (store && store.metadata) {
      const meta = typeof store.metadata === "string" ? JSON.parse(store.metadata) : store.metadata
      if (Array.isArray(meta.announcements) && meta.announcements.length > 0) {
        announcements = meta.announcements
      }
    }

    if (!announcements || announcements.length === 0) {
      announcements = DEFAULT_ANNOUNCEMENTS
    }

    return res.json({ announcements })
  } catch (error: any) {
    console.error("Admin fetch announcements error:", error)
    return res.status(500).json({ message: error.message || "Failed to fetch announcements" })
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { announcements } = req.body as { announcements: string[] }

  if (!Array.isArray(announcements)) {
    return res.status(400).json({ message: "announcements array is required" })
  }

  const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    const store = await pgConnection("store").select("id", "metadata").first()
    if (!store) {
      return res.status(404).json({ message: "Store not found" })
    }

    const currentMeta = typeof store.metadata === "string"
      ? JSON.parse(store.metadata)
      : (store.metadata || {})

    const cleanAnnouncements = announcements
      .map((item: any) => (typeof item === "string" ? item.trim() : ""))
      .filter((item: string) => item.length > 0)

    const updatedMeta = {
      ...currentMeta,
      announcements: cleanAnnouncements.length > 0 ? cleanAnnouncements : DEFAULT_ANNOUNCEMENTS,
    }

    await pgConnection("store")
      .where({ id: store.id })
      .update({
        metadata: JSON.stringify(updatedMeta),
      })

    // Trigger storefront cache revalidation
    try {
      const storeUrl = process.env.STORE_CORS?.split(",")[0] || "http://localhost:8000"
      await fetch(`${storeUrl}/api/revalidate`, { method: "POST" })
    } catch (e) {
      console.error("Failed to revalidate storefront cache", e)
    }

    return res.json({
      success: true,
      message: "Announcements updated successfully",
      announcements: updatedMeta.announcements,
    })
  } catch (error: any) {
    console.error("Admin save announcements error:", error)
    return res.status(500).json({ message: error.message || "Failed to update announcements" })
  }
}
