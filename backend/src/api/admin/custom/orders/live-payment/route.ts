import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import https from "https"

function razorpayGet(path: string, keyId: string, keySecret: string): Promise<any> {
  return new Promise((resolve) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    const options = {
      hostname: "api.razorpay.com",
      path: `/v1${path}`,
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      timeout: 8000,
    }

    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", chunk => data += chunk)
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          resolve(null)
        }
      })
    })

    req.on("error", () => resolve(null))
    req.on("timeout", () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { order_id } = req.query as { order_id?: string }

  if (!order_id) {
    return res.status(400).json({ success: false, message: "order_id parameter is required" })
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_ID || ""
  const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || ""

  try {
    const pgConnection = (req.scope as any).__pg_connection__ || 
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      return res.status(500).json({ success: false, message: "Database connection unavailable" })
    }

    const order = await pgConnection("order").where("id", order_id).first()
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    // Find payment records
    const payments = await pgConnection("payment")
      .whereIn("payment_collection_id", function (this: any) {
        this.select("payment_collection_id").from("order_payment_collection").where("order_id", order_id)
      })
      .select("id", "provider_id", "amount", "data", "captured_at", "canceled_at")

    let rzpPayId: string | null = null
    let rzpOrderId: string | null = null

    for (const p of payments) {
      const pData = typeof p.data === "object" && p.data !== null ? p.data : {}
      if (pData.razorpay_payment_id) rzpPayId = pData.razorpay_payment_id
      else if (pData.id && String(pData.id).startsWith("pay_")) rzpPayId = pData.id

      if (pData.razorpay_order_id) rzpOrderId = pData.razorpay_order_id
      else if (pData.id && String(pData.id).startsWith("order_")) rzpOrderId = pData.id
    }

    let liveRzpData: any = null

    if (keyId && keySecret) {
      if (rzpPayId) {
        liveRzpData = await razorpayGet(`/payments/${rzpPayId}`, keyId, keySecret)
      } else if (rzpOrderId) {
        const ordPayments = await razorpayGet(`/orders/${rzpOrderId}/payments`, keyId, keySecret)
        if (ordPayments && ordPayments.items && ordPayments.items.length > 0) {
          liveRzpData = ordPayments.items[0]
          rzpPayId = liveRzpData.id
        }
      }
    }

    const formatDt = (date: Date) => {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }

    // Determine final status
    const status = liveRzpData?.status || (payments.some(p => p.captured_at) ? "captured" : "not_paid")
    const amount = liveRzpData?.amount ? (liveRzpData.amount / 100) : (payments[0]?.amount || 0)
    const method = liveRzpData?.method ? liveRzpData.method.toUpperCase() : ""
    const createdAt = liveRzpData?.created_at ? new Date(liveRzpData.created_at * 1000) : new Date(order.created_at)

    let isSafeToFulfill = false
    let friendlyMessage = ""
    let badgeType: "captured" | "refunded" | "pending" | "failed" = "pending"

    if (status === "refunded" || (liveRzpData && liveRzpData.amount_refunded > 0 && liveRzpData.amount_refunded === liveRzpData.amount)) {
      isSafeToFulfill = false
      badgeType = "refunded"
      friendlyMessage = `Payment was Refunded on ${formatDt(createdAt)}${rzpPayId ? ` (Razorpay: ${rzpPayId})` : ""}`
    } else if (status === "captured" || status === "paid") {
      isSafeToFulfill = true
      badgeType = "captured"
      friendlyMessage = `Paid ₹${amount.toFixed(2)}${method ? ` via ${method}` : ""} on ${formatDt(createdAt)}${rzpPayId ? ` (${rzpPayId})` : ""}`
    } else if (rzpPayId && status === "failed") {
      isSafeToFulfill = false
      badgeType = "failed"
      friendlyMessage = `Payment Failed on ${formatDt(createdAt)}: ${liveRzpData?.error_description || "Declined"}`
    } else {
      isSafeToFulfill = false
      badgeType = "pending"
      friendlyMessage = `Payment was NOT received / completed (Pending since ${formatDt(createdAt)})`
    }

    return res.json({
      success: true,
      order_id,
      display_id: order.display_id,
      status,
      badge_type: badgeType,
      amount,
      method: liveRzpData?.method || null,
      payment_id: rzpPayId,
      order_id_rzp: rzpOrderId,
      created_at: createdAt.toISOString(),
      friendly_message: friendlyMessage,
      is_safe_to_fulfill: isSafeToFulfill,
      live_details: liveRzpData ? {
        id: liveRzpData.id,
        status: liveRzpData.status,
        amount: liveRzpData.amount / 100,
        currency: liveRzpData.currency,
        method: liveRzpData.method,
        email: liveRzpData.email,
        contact: liveRzpData.contact,
        fee: liveRzpData.fee ? liveRzpData.fee / 100 : null,
        tax: liveRzpData.tax ? liveRzpData.tax / 100 : null,
        error_description: liveRzpData.error_description || null,
      } : null,
    })
  } catch (error: any) {
    console.error("[LivePaymentStatus] Error:", error)
    return res.status(500).json({ success: false, message: error.message })
  }
}
