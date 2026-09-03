import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "crypto"
import { isRazorpayPaymentCaptured } from "../../../../lib/razorpay"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const signature = req.headers["x-razorpay-signature"] as string
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

  const body = req.body as any

  // 1. Signature Verification if secret is configured
  if (webhookSecret && signature) {
    try {
      const rawPayload = typeof body === "string" ? body : JSON.stringify(body)
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawPayload)
        .digest("hex")

      if (expectedSignature !== signature) {
        console.warn("[RazorpayWebhook] Signature mismatch. Ignoring webhook.")
        return res.status(400).json({ error: "Invalid signature" })
      }
    } catch (sigErr: any) {
      console.error("[RazorpayWebhook] Signature verification error:", sigErr.message)
      return res.status(400).json({ error: "Signature verification failed" })
    }
  }

  const event = body?.event
  console.log(`[RazorpayWebhook] Received event: ${event}`)

  if (event !== "payment.captured" && event !== "order.paid" && event !== "payment.authorized") {
    return res.status(200).json({ status: "ignored" })
  }

  const paymentEntity = body?.payload?.payment?.entity
  const orderEntity = body?.payload?.order?.entity

  const rzpPaymentId = paymentEntity?.id
  const rzpOrderId = paymentEntity?.order_id || orderEntity?.id

  if (!rzpPaymentId && !rzpOrderId) {
    return res.status(200).json({ status: "no_payment_or_order_id" })
  }

  // 2. Double-check live status with Razorpay for ultimate authenticity
  const verifyTarget = rzpPaymentId || rzpOrderId
  const verification = await isRazorpayPaymentCaptured(verifyTarget)

  if (!verification.captured) {
    console.warn(`[RazorpayWebhook] Payment ${verifyTarget} is not captured in live Razorpay. Status: ${verification.status}`)
    return res.status(200).json({ status: "not_captured_in_gateway" })
  }

  try {
    const pgConnection = (req.scope as any).__pg_connection__ || 
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      console.error("[RazorpayWebhook] Database connection unavailable")
      return res.status(500).json({ error: "Database connection unavailable" })
    }

    // 3. Find matching payment session in Medusa DB
    const matchingSession = await pgConnection("payment_session")
      .whereRaw(`data->>'id' = ? OR data->>'razorpay_order_id' = ? OR data->>'razorpay_payment_id' = ?`, [rzpOrderId, rzpOrderId, rzpPaymentId])
      .first()

    if (matchingSession) {
      const pcId = matchingSession.payment_collection_id
      const capturedAmount = verification.amount || matchingSession.amount || 0

      // Update payment_collection to completed
      await pgConnection("payment_collection")
        .where("id", pcId)
        .update({
          status: "completed",
          captured_amount: capturedAmount,
          raw_captured_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
          authorized_amount: capturedAmount,
          raw_authorized_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
          completed_at: new Date(),
        })

      // Update payment_session
      const updatedData = {
        ...(matchingSession.data || {}),
        razorpay_payment_id: rzpPaymentId || matchingSession.data?.razorpay_payment_id,
        razorpay_order_id: rzpOrderId || matchingSession.data?.razorpay_order_id,
        status: "captured",
      }

      await pgConnection("payment_session")
        .where("id", matchingSession.id)
        .update({
          status: "authorized",
          authorized_at: new Date(),
          data: updatedData,
        })

      // Ensure payment record exists
      const existingPay = await pgConnection("payment").where("payment_collection_id", pcId).first()
      if (!existingPay) {
        const paymentId = `pay_${Date.now()}`
        await pgConnection("payment").insert({
          id: paymentId,
          amount: String(capturedAmount),
          raw_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
          currency_code: "inr",
          provider_id: "pp_razorpay_razorpay",
          data: updatedData,
          created_at: new Date(),
          updated_at: new Date(),
          captured_at: new Date(),
          payment_collection_id: pcId,
          payment_session_id: matchingSession.id,
        })
      } else if (!existingPay.captured_at) {
        await pgConnection("payment").where("id", existingPay.id).update({
          captured_at: new Date(),
          data: updatedData,
        })
      }

      console.log(`[RazorpayWebhook] ✅ Successfully reconciled payment for collection ${pcId} (Payment: ${rzpPaymentId})`)
    } else {
      console.log(`[RazorpayWebhook] No matching payment session found for Razorpay Order ${rzpOrderId} / Payment ${rzpPaymentId}`)
    }

    return res.status(200).json({ status: "success" })
  } catch (err: any) {
    console.error("[RazorpayWebhook] Error processing webhook:", err.message)
    return res.status(500).json({ error: err.message })
  }
}
