import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const DEFAULT_ANNOUNCEMENTS = [
  "Free Delivery Eligible On Orders Above ₹{threshold}",
  "Rakhi offer: 5% off on all products on purchase of Rs 999, Use Code RAKHI5",
  "Glow this Rakhi: 5% Off on Magic Pedi. Use Code RAKHI5"
]

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const pgConnection = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    const store = await pgConnection("store").select("metadata").first()

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

    // Set CORS headers for storefront queries
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return res.json({ announcements })
  } catch (error: any) {
    console.error("Error fetching announcements:", error)
    return res.json({ announcements: DEFAULT_ANNOUNCEMENTS })
  }
}
