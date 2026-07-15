import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { shiprocketClient } from "../../../../modules/shiprocket/shiprocket-client"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const awb = req.query.awb as string
  const shipmentId = req.query.shipment_id as string

  if (!awb && !shipmentId) {
    res.status(400).json({
      message: "Either 'awb' or 'shipment_id' query parameter is required."
    })
    return
  }

  try {
    if (awb) {
      console.log(`[StoreTrackShipment] Tracking by AWB: ${awb}`)
      const result = await shiprocketClient.getTrackingDetails(awb)
      res.status(200).json(result)
    } else {
      console.log(`[StoreTrackShipment] Tracking by shipment_id: ${shipmentId}`)
      const result = await shiprocketClient.getShipmentTracking(shipmentId)
      res.status(200).json(result)
    }
  } catch (error: any) {
    console.error("[StoreTrackShipment] Failed to get tracking details:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}
