import { MedusaContainer } from "@medusajs/framework/types"
import { syncOrderToShiprocket, syncAllShiprocketStatuses } from "../lib/shiprocket-sync"
import { shiprocketClient } from "../modules/shiprocket/shiprocket-client"
import { isRazorpayPaymentCaptured } from "../lib/razorpay"
import { sendAlertEmail } from "../lib/email"
import { startJobLog, finishJobLog } from "../lib/cron-logger"

export default async function nightlyAutoFulfillJob(container: MedusaContainer) {
  if (process.env.SHIPROCKET_ENV !== "production") {
    console.log("[NightlyAutoFulfillJob] Skipped: SHIPROCKET_ENV is not 'production'")
    return
  }

  console.log("[NightlyAutoFulfillJob] 🌙 Starting nightly Shiprocket fulfillment scan...")
  let logId: any = null

  try {
    const cAny = container as any
    const pgConnection = cAny.__pg_connection__ || 
      (container.resolve ? container.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (container.resolve ? container.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      console.error("[NightlyAutoFulfillJob] Database connection unavailable")
      return
    }

    logId = await startJobLog(pgConnection, "nightly-shiprocket-fulfill")

    // Step 0: Pre-flight Shiprocket Health & Auth Check to prevent lockout loops
    try {
      console.log("[NightlyAutoFulfillJob] Verifying Shiprocket API health & authentication...")
      await shiprocketClient.getOrders("?per_page=1")
      console.log("[NightlyAutoFulfillJob] Shiprocket API is healthy & authenticated.")
    } catch (authErr: any) {
      const errMsg = authErr.message || ""
      if (errMsg.includes("User blocked") || errMsg.includes("failed login attempts") || errMsg.includes("403")) {
        console.error("[NightlyAutoFulfillJob] 🚨 CRITICAL: Shiprocket lockout detected:", errMsg)
        await sendAlertEmail(
          "Shiprocket API Lockout Detected - Nightly Job Paused",
          `
            <p><strong>Warning:</strong> The nightly Shiprocket auto-fulfillment job detected an API account lockout.</p>
            <p><strong>Error Message:</strong> ${errMsg}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
            <p>The nightly fulfillment loop was paused to protect against further account suspension. Please check your credentials at <a href="https://app.shiprocket.in">app.shiprocket.in</a>.</p>
          `
        )
        return
      }
      console.warn("[NightlyAutoFulfillJob] Pre-flight warning:", errMsg)
    }

    // Step 1: Look for paid orders created in the last 7 days that are not canceled and have 0 fulfillments
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const unfulfilledOrders = await pgConnection.raw(`
      SELECT o.id, o.display_id, o.email, o.created_at, o.status
      FROM "order" o
      JOIN order_payment_collection opc ON opc.order_id = o.id
      JOIN payment_collection pc ON pc.id = opc.payment_collection_id
      WHERE o.created_at >= ?
        AND o.status != 'canceled'
        AND pc.status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM order_fulfillment of
          JOIN fulfillment f ON of.fulfillment_id = f.id
          WHERE of.order_id = o.id AND f.canceled_at IS NULL
        )
      ORDER BY o.display_id ASC;
    `, [sevenDaysAgo]).then((r: any) => r.rows || [])

    console.log(`[NightlyAutoFulfillJob] Step 1: Found ${unfulfilledOrders.length} unfulfilled order(s) to process.`)

    let successCount = 0
    let failedCount = 0

    for (const ord of unfulfilledOrders) {
      console.log(`[NightlyAutoFulfillJob] Processing Order #${ord.display_id} (${ord.id})...`)

      // Intelligently validate with live Razorpay API before dispatching to Shiprocket
      try {
        const paymentRecord = await pgConnection("payment")
          .join("order_payment_collection", "order_payment_collection.payment_collection_id", "payment.payment_collection_id")
          .where("order_payment_collection.order_id", ord.id)
          .select("payment.data", "payment.captured_at")
          .first()

        const pData = paymentRecord?.data || {}
        const targetPayId = pData.razorpay_payment_id || (pData.id && String(pData.id).startsWith("pay_") ? pData.id : null) || pData.razorpay_order_id || (pData.id && String(pData.id).startsWith("order_") ? pData.id : null)

        if (targetPayId) {
          const rzpCheck = await isRazorpayPaymentCaptured(String(targetPayId))
          if (!rzpCheck.captured) {
            console.warn(`[NightlyAutoFulfillJob] ⚠️ Order #${ord.display_id} skipped: Razorpay payment ${targetPayId} is not captured (status: '${rzpCheck.status}').`)
            await sendAlertEmail(
              `Order #${ord.display_id} Skipped - Razorpay Payment Unverified`,
              `
                <p>Order <strong>#${ord.display_id}</strong> was queued for fulfillment, but live verification with Razorpay returned status <code>${rzpCheck.status}</code> (not captured).</p>
                <p><strong>Reference ID:</strong> ${targetPayId}</p>
                <p><strong>Customer:</strong> ${ord.email}</p>
                <p>The fulfillment was skipped to avoid dispatching an unpaid order.</p>
              `
            )
            continue
          }
        }
      } catch (rzpVerifyErr: any) {
        console.warn(`[NightlyAutoFulfillJob] Razorpay pre-validation warning for #${ord.display_id}:`, rzpVerifyErr.message)
      }

      const res = await syncOrderToShiprocket(ord.id, container)

      if (res.success) {
        successCount++
        console.log(`[NightlyAutoFulfillJob] ✅ Order #${ord.display_id}: ${res.message}`)
      } else {
        failedCount++
        console.error(`[NightlyAutoFulfillJob] ❌ Order #${ord.display_id} failed: ${res.message}`)

        if (res.message?.includes("User blocked") || res.message?.includes("login attempts")) {
          console.error("[NightlyAutoFulfillJob] 🚨 Aborting remaining orders due to Shiprocket lockout.")
          await sendAlertEmail(
            "Shiprocket Lockout Detected During Order Sync",
            `
              <p>While fulfilling Order #${ord.display_id}, Shiprocket responded with: <strong>${res.message}</strong>.</p>
              <p>Fulfillment of remaining orders was paused to prevent account suspension.</p>
            `
          )
          break
        }
      }
    }

    console.log(`[NightlyAutoFulfillJob] Finished unfulfilled scan: ${successCount} synced, ${failedCount} failed out of ${unfulfilledOrders.length} total.`)

    // Step 2: Synchronize tracking, AWBs, Shipped & Delivered statuses from Shiprocket
    console.log("[NightlyAutoFulfillJob] Step 2: Synchronizing live tracking & shipping statuses from Shiprocket...")
    const statusSyncRes = await syncAllShiprocketStatuses(container, 30)
    console.log(`[NightlyAutoFulfillJob] Live status sync complete: ${statusSyncRes.matchedCount} orders checked, ${statusSyncRes.updatedCount} fulfillments updated.`)

    const finalSummary = `Scanned ${unfulfilledOrders.length} unfulfilled order(s). ${successCount} synced, ${failedCount} failed. Tracking sync: ${statusSyncRes.matchedCount} orders checked, ${statusSyncRes.updatedCount} fulfillments updated.`
    if (logId) {
      await finishJobLog(pgConnection, logId, {
        status: failedCount > 0 ? "warning" : "success",
        summary: finalSummary,
        details: {
          unfulfilledOrdersCount: unfulfilledOrders.length,
          syncedCount: successCount,
          failedCount: failedCount,
          statusSyncMatched: statusSyncRes.matchedCount,
          statusSyncUpdated: statusSyncRes.updatedCount,
        }
      })
    }

  } catch (error: any) {
    console.error("[NightlyAutoFulfillJob] Fatal error during nightly fulfillment scan:", error)
    if (logId) {
      const cAny = container as any
      const pgConnection = cAny.__pg_connection__ || 
        (container.resolve ? container.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
        (container.resolve ? container.resolve("pg_connection", { allowUnregistered: true }) : null)
      if (pgConnection) {
        await finishJobLog(pgConnection, logId, {
          status: "failed",
          summary: `Fatal error: ${error.message}`,
          details: { error: error.stack }
        })
      }
    }
  }
}

export const config = {
  name: "nightly-shiprocket-fulfill",
  schedule: "0 20 * * *", // Runs every night at 20:00 UTC (1:30 AM IST)
}
