import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Shiprocket Tracking Webhook Handler
 * Endpoint: POST /hooks/shiprocket/tracking
 *
 * Receives live tracking events directly from Shiprocket when:
 * 1. An order is SHIPPED / IN TRANSIT / OUT FOR DELIVERY
 * 2. An order is DELIVERED
 *
 * For Partial COD orders:
 * When status is DELIVERED, automatically marks the remaining COD balance as COLLECTED
 * and sets the order status to fully paid/settled.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as any
    console.log("[ShiprocketWebhook] Received tracking webhook:", JSON.stringify(body))

    if (!body) {
      return res.status(400).json({ error: "Empty payload" })
    }

    const pgConnection =
      (req.scope as any).__pg_connection__ ||
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      console.error("[ShiprocketWebhook] Database connection unavailable")
      return res.status(500).json({ error: "Database connection unavailable" })
    }

    // Extract identifiers from Shiprocket payload
    const channelOrderId = body.channel_order_id || body.order_channel_order_id || body.order_id || ""
    const awbCode = body.awb || body.awb_code || ""
    const currentStatus = (body.current_status || body.shipment_status || body.status || "").toUpperCase()
    const courierName = body.courier_name || ""
    const deliveredDate = body.delivered_date || body.delivered_at || new Date()

    let displayId: number | null = null
    const cleanIdMatch = String(channelOrderId).match(/OD0*(\d+)/i)
    if (cleanIdMatch) {
      displayId = parseInt(cleanIdMatch[1], 10)
    } else if (!isNaN(Number(channelOrderId)) && Number(channelOrderId) > 0) {
      displayId = Number(channelOrderId)
    }

    // Try finding order by display_id or by fulfillment AWB code
    let medusaOrder: any = null
    if (displayId) {
      medusaOrder = await pgConnection("order").where("display_id", displayId).first()
    }

    if (!medusaOrder && awbCode) {
      const ful = await pgConnection("fulfillment")
        .whereRaw(`data->>'awb_code' = ?`, [awbCode])
        .first()
      if (ful) {
        const ordFul = await pgConnection("order_fulfillment")
          .where("fulfillment_id", ful.id)
          .first()
        if (ordFul) {
          medusaOrder = await pgConnection("order").where("id", ordFul.order_id).first()
        }
      }
    }

    if (!medusaOrder) {
      console.log(`[ShiprocketWebhook] No matching order found for channel_order_id: ${channelOrderId}, AWB: ${awbCode}`)
      return res.status(200).json({ status: "order_not_found" })
    }

    console.log(`[ShiprocketWebhook] Matched Order #${medusaOrder.display_id} with status: ${currentStatus}`)

    // Update fulfillment tracking data
    const orderFulfillments = await pgConnection("order_fulfillment").where("order_id", medusaOrder.id)
    if (orderFulfillments.length > 0) {
      const fulId = orderFulfillments[0].fulfillment_id
      const existingFul = await pgConnection("fulfillment").where("id", fulId).first()
      if (existingFul) {
        const currentData = typeof existingFul.data === "object" && existingFul.data !== null ? existingFul.data : {}
        const isDelivered = currentStatus === "DELIVERED"
        const isShipped = ["IN TRANSIT", "SHIPPED", "OUT FOR DELIVERY", "DELIVERED"].includes(currentStatus)

        await pgConnection("fulfillment")
          .where("id", fulId)
          .update({
            data: JSON.stringify({
              ...currentData,
              awb_code: awbCode || currentData.awb_code,
              courier_name: courierName || currentData.courier_name,
              shiprocket_status: currentStatus,
              shiprocket_webhook_payload: body,
            }),
            shipped_at: isShipped ? (existingFul.shipped_at || new Date()) : existingFul.shipped_at,
            delivered_at: isDelivered ? (existingFul.delivered_at || new Date(deliveredDate)) : existingFul.delivered_at,
            updated_at: new Date(),
          })
      }
    }

    // If order is DELIVERED, automatically mark remaining Partial COD balance as received
    if (currentStatus === "DELIVERED") {
      const orderMeta =
        typeof medusaOrder.metadata === "string"
          ? JSON.parse(medusaOrder.metadata)
          : medusaOrder.metadata || {}

      if (orderMeta.payment_mode === "partial_cod") {
        const updatedOrderMeta = {
          ...orderMeta,
          cod_balance_collected: true,
          cod_collected_at: new Date(deliveredDate),
          settlement_status: "fully_paid",
          note: `✅ Delivered: ₹${orderMeta.advance_paid || 0} paid online advance (${orderMeta.partial_percentage || 15}%), ₹${orderMeta.cod_balance || 0} collected at doorstep on delivery. Order fully settled.`,
        }

        await pgConnection("order")
          .where("id", medusaOrder.id)
          .update({
            metadata: JSON.stringify(updatedOrderMeta),
            updated_at: new Date(),
          })

        console.log(`[ShiprocketWebhook] 💰 Order #${medusaOrder.display_id} Partial COD balance (₹${orderMeta.cod_balance}) marked COLLECTED!`)
      }
    }

    return res.status(200).json({ status: "success", order_id: medusaOrder.id, display_id: medusaOrder.display_id })
  } catch (err: any) {
    console.error("[ShiprocketWebhook] Error handling webhook:", err.message)
    return res.status(500).json({ error: err.message })
  }
}
