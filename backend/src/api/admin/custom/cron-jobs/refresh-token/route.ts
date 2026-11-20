import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { shiprocketClient } from "../../../../../modules/shiprocket/shiprocket-client"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[ShiprocketRefreshTokenAPI] Admin requested manual Shiprocket token refresh...")

    // 1. Force refresh token
    const refreshResult = await shiprocketClient.forceRefreshToken()

    // 2. Validate API health with newly generated token
    console.log("[ShiprocketRefreshTokenAPI] Validating fresh token against Shiprocket orders API...")
    await shiprocketClient.getOrders("?per_page=1")
    console.log("[ShiprocketRefreshTokenAPI] ✅ Fresh token verified with Shiprocket API successfully!")

    return res.json({
      success: true,
      message: `Shiprocket token recreated and validated successfully! Valid for ${refreshResult.remainingDays} days ${refreshResult.remainingHours} hours.`,
      expires_at: refreshResult.expiresAt.toISOString(),
      remaining_days: refreshResult.remainingDays,
      remaining_hours: refreshResult.remainingHours,
    })
  } catch (err: any) {
    console.error("[ShiprocketRefreshTokenAPI] Failed to refresh Shiprocket token:", err)
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to recreate Shiprocket auth token. Check credentials or rate limit.",
    })
  }
}

