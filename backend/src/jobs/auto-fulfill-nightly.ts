import { MedusaContainer } from "@medusajs/framework/types"
import { syncOrderToShiprocket, syncAllShiprocketStatuses } from "../lib/shiprocket-sync"
import { shiprocketClient } from "../modules/shiprocket/shiprocket-client"
import { isRazorpayPaymentCaptured } from "../lib/razorpay"
import { sendAlertEmail, sendPeriodicHealthReportEmail } from "../lib/email"
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

    // Step 0: Pre-flight Shiprocket Health & Auth Check with 15s cooldown retry
    let isHealthy = false
    let lastAuthError = ""
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[NightlyAutoFulfillJob] Verifying Shiprocket API health & authentication (attempt ${attempt}/2)...`)
        await shiprocketClient.getOrders("?per_page=1")
        console.log("[NightlyAutoFulfillJob] Shiprocket API is healthy & authenticated.")
        isHealthy = true
        break
      } catch (authErr: any) {
        lastAuthError = authErr.message || ""
        console.warn(`[NightlyAutoFulfillJob] Pre-flight check attempt ${attempt}/2 warning:`, lastAuthError)
        if (attempt < 2) {
          console.log("[NightlyAutoFulfillJob] Cooling down for 15s before pre-flight retry to avoid top-of-the-hour rate limit spikes...")
          await new Promise((resolve) => setTimeout(resolve, 15000))
        }
      }
    }

    if (!isHealthy) {
      if (lastAuthError.includes("User blocked") || lastAuthError.includes("failed login attempts") || lastAuthError.includes("403")) {
        console.error("[NightlyAutoFulfillJob] 🚨 CRITICAL: Shiprocket lockout confirmed after retries:", lastAuthError)
        if (logId) {
          await finishJobLog(pgConnection, logId, {
            status: "failed",
            summary: `Shiprocket API authentication failed: ${lastAuthError}`,
            details: { error: lastAuthError }
          })
        }
        await sendAlertEmail(
          "Shiprocket API Lockout Detected - Nightly Job Paused",
          `
            <p><strong>Warning:</strong> The nightly Shiprocket auto-fulfillment job detected an API account lockout.</p>
            <p><strong>Error Message:</strong> ${lastAuthError}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
            <p>The nightly fulfillment loop was paused to protect against further account suspension. Please check your credentials at <a href="https://app.shiprocket.in">app.shiprocket.in</a>.</p>
          `
        )
        return
      }
      console.warn("[NightlyAutoFulfillJob] Pre-flight non-lockout warning:", lastAuthError)
    }

    // Step 1: Look for all active orders created in the last 7 days that are not canceled and have 0 fulfillments
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const unfulfilledOrders = await pgConnection.raw(`
      SELECT o.id, o.display_id, o.email, o.created_at, o.status, pc.status as payment_status, pc.id as payment_collection_id
      FROM "order" o
      JOIN order_payment_collection opc ON opc.order_id = o.id
      JOIN payment_collection pc ON pc.id = opc.payment_collection_id
      WHERE o.created_at >= ?
        AND o.status != 'canceled'
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
      console.log(`[NightlyAutoFulfillJob] Processing Order #${ord.display_id} (${ord.id}) - Current Payment Status: ${ord.payment_status}...`)

      let isPaymentConfirmed = ord.payment_status === "completed"

      // Intelligently validate with live Razorpay API & auto-reconcile if needed
      try {
        const sessionRecord = await pgConnection("payment_session")
          .where("payment_collection_id", ord.payment_collection_id)
          .first()
        const paymentRecord = await pgConnection("payment")
          .where("payment_collection_id", ord.payment_collection_id)
          .first()

        const pData = paymentRecord?.data || sessionRecord?.data || {}
        const targetPayId = pData.razorpay_payment_id || 
          (pData.id && String(pData.id).startsWith("pay_") ? pData.id : null) || 
          pData.razorpay_order_id || 
          (pData.id && String(pData.id).startsWith("order_") ? pData.id : null)

        if (targetPayId) {
          const rzpCheck = await isRazorpayPaymentCaptured(String(targetPayId))
          if (rzpCheck.captured) {
            isPaymentConfirmed = true
            // If payment_collection was not marked completed, reconcile it now
            if (ord.payment_status !== "completed") {
              console.log(`[NightlyAutoFulfillJob] 🔄 Auto-reconciling paid order #${ord.display_id} (Razorpay: ${targetPayId})...`)
              const capturedAmount = rzpCheck.amount || sessionRecord?.amount || 0
              await pgConnection("payment_collection")
                .where("id", ord.payment_collection_id)
                .update({
                  status: "completed",
                  captured_amount: capturedAmount,
                  raw_captured_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
                  authorized_amount: capturedAmount,
                  raw_authorized_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
                  completed_at: new Date(),
                })

              if (sessionRecord) {
                await pgConnection("payment_session")
                  .where("id", sessionRecord.id)
                  .update({
                    status: "authorized",
                    authorized_at: new Date(),
                    data: { ...(sessionRecord.data || {}), status: "captured" }
                  })
              }

              if (!paymentRecord && sessionRecord) {
                await pgConnection("payment").insert({
                  id: `pay_${Date.now()}`,
                  amount: String(capturedAmount),
                  raw_amount: JSON.stringify({ value: String(capturedAmount), precision: 20 }),
                  currency_code: "inr",
                  provider_id: "pp_razorpay_razorpay",
                  data: { ...(sessionRecord.data || {}), status: "captured" },
                  created_at: new Date(),
                  updated_at: new Date(),
                  captured_at: new Date(),
                  payment_collection_id: ord.payment_collection_id,
                  payment_session_id: sessionRecord.id,
                })
              }
              console.log(`[NightlyAutoFulfillJob] ✅ Order #${ord.display_id} payment reconciled to 'completed'.`)
            }
          } else {
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

      if (!isPaymentConfirmed) {
        console.warn(`[NightlyAutoFulfillJob] Order #${ord.display_id} payment unconfirmed. Skipping fulfillment.`)
        continue
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

    // Step 3: Periodic 3-Day Health & 7-Day Fulfillment Confirmation Email
    let digestSent = false
    try {
      const lastDigestLog = await pgConnection("cron_job_log")
        .where("job_name", "nightly-shiprocket-fulfill")
        .whereRaw("(details->>'digest_sent')::boolean = true")
        .orderBy("started_at", "desc")
        .first()

      const threeDaysMs = 3 * 24 * 60 * 60 * 1000 - 3600000 // 3 days (with 1-hour grace window)
      const shouldSendDigest = !lastDigestLog || (Date.now() - new Date(lastDigestLog.started_at).getTime() >= threeDaysMs)

      if (shouldSendDigest) {
        console.log("[NightlyAutoFulfillJob] 📬 3-Day interval reached. Generating 7-day fulfillment health report email...")

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        const recentOrdersRaw = await pgConnection.raw(`
          SELECT 
            o.id, 
            o.display_id, 
            o.email, 
            o.created_at, 
            pc.status as payment_status,
            COALESCE((os.totals->>'current_order_total')::numeric, 0) as total_amount,
            f.data->>'shiprocket_order_id' as sr_order_id,
            f.data->>'shiprocket_shipment_id' as sr_shipment_id,
            f.data->>'awb_code' as awb_code,
            f.data->'shiprocket_response'->>'status' as sr_status
          FROM "order" o
          LEFT JOIN order_summary os ON os.order_id = o.id
          LEFT JOIN order_payment_collection opc ON opc.order_id = o.id
          LEFT JOIN payment_collection pc ON pc.id = opc.payment_collection_id
          LEFT JOIN order_fulfillment of ON of.order_id = o.id
          LEFT JOIN fulfillment f ON of.fulfillment_id = f.id AND f.canceled_at IS NULL
          WHERE o.created_at >= ?
            AND o.status != 'canceled'
          ORDER BY o.display_id DESC
          LIMIT 10;
        `, [sevenDaysAgo]).then((r: any) => r.rows || []).catch(() => [])

        const totalOrders = recentOrdersRaw.length
        let totalRevenue = 0
        let paidOrders = 0
        let fulfilledOrders = 0

        for (const ord of recentOrdersRaw) {
          totalRevenue += parseFloat(ord.total_amount || "0")
          if (ord.payment_status === "completed") paidOrders++
          if (ord.sr_order_id || ord.sr_shipment_id) fulfilledOrders++
        }

        // Fetch RDS token validity info
        let daysRemainingStr = "N/A"
        let expiresAtStr = "N/A"
        let isTokenValid = false
        try {
          const tokenCacheRes = await pgConnection("shiprocket_token_cache")
            .where("id", 1)
            .first()
          if (tokenCacheRes && tokenCacheRes.expires_at) {
            const exp = new Date(tokenCacheRes.expires_at)
            isTokenValid = exp > new Date()
            const diffMs = exp.getTime() - Date.now()
            daysRemainingStr = Math.max(0, diffMs / (1000 * 60 * 60 * 24)).toFixed(1)
            expiresAtStr = exp.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })
          }
        } catch (_) {}

        await sendPeriodicHealthReportEmail({
          timeZoneString: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          lastSevenDaysStats: {
            totalOrders,
            totalRevenue,
            paidOrders,
            fulfilledOrders,
            unfulfilledOrders: unfulfilledOrders.length,
          },
          recentOrders: recentOrdersRaw.map((o: any) => ({
            display_id: o.display_id,
            email: o.email,
            total_amount: parseFloat(o.total_amount || "0"),
            created_at: new Date(o.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
            payment_status: o.payment_status || "unknown",
            sr_order_id: o.sr_order_id,
            sr_shipment_id: o.sr_shipment_id,
            awb_code: o.awb_code,
            sr_status: o.sr_status,
          })),
          tokenInfo: {
            isValid: isTokenValid,
            expiresAt: expiresAtStr,
            daysRemaining: daysRemainingStr,
          },
          syncStats: {
            checkedCount: statusSyncRes.matchedCount,
            updatedCount: statusSyncRes.updatedCount,
          },
          nextScheduledRun: "Tomorrow at 2:23 AM IST",
        })

        digestSent = true
        console.log("[NightlyAutoFulfillJob] ✅ 3-Day confirmation health report email sent successfully!")
      } else {
        const lastSentDate = lastDigestLog?.started_at ? new Date(lastDigestLog.started_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"
        console.log(`[NightlyAutoFulfillJob] 3-Day digest skipped (last sent at ${lastSentDate}).`)
      }
    } catch (digestErr: any) {
      console.warn("[NightlyAutoFulfillJob] Error generating 3-day digest email:", digestErr.message)
    }

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
          digest_sent: digestSent,
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
  schedule: "53 20 * * *", // Runs every night at 20:53 UTC (2:23 AM IST) to avoid top-of-the-hour API spikes
}
