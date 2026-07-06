import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { shiprocketClient } from "../../../../modules/shiprocket/shiprocket-client"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const pincode = req.query.pincode as string

  if (!pincode) {
    res.status(400).json({
      message: "Pincode query parameter is required."
    })
    return
  }

  try {
    console.log(`[StoreCheckServiceability] Checking serviceability for pincode: ${pincode}`)
    const result = await shiprocketClient.checkServiceability(pincode)
    res.status(200).json(result)
  } catch (error: any) {
    console.error("[StoreCheckServiceability] Failed to check serviceability:", error)
    res.status(500).json({
      serviceable: false,
      error: error.message
    })
  }
}
