import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyPresignedActionToken } from "../../../../lib/presigned-action"
import { shiprocketClient } from "../../../../modules/shiprocket/shiprocket-client"
import { syncOrderToShiprocket, syncAllShiprocketStatuses } from "../../../../lib/shiprocket-sync"
import { startJobLog, finishJobLog } from "../../../../lib/cron-logger"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const token = req.query.token as string

  // 1. Verify Presigned Token & 6-Hour Expiry Window
  const verification = verifyPresignedActionToken(token, "retry_shiprocket_fulfillment")

  res.setHeader("Content-Type", "text/html; charset=utf-8")

  if (!verification.valid) {
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProCare • Link Expired or Invalid</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; margin: 0; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: #ffffff; border-radius: 16px; max-width: 520px; width: 100%; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); text-align: center; }
          .icon { width: 64px; height: 64px; border-radius: 50%; background: #fef2f2; color: #dc2626; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
          h1 { margin: 0 0 12px; font-size: 22px; color: #0f172a; font-weight: 700; }
          p { margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6; }
          .reason { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 13px; color: #b91c1c; font-family: monospace; margin-bottom: 24px; }
          .btn { display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
          .btn:hover { background: #1e293b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">⚠️</div>
          <h1>Action Link Unavailable</h1>
          <p>This 1-click retry link cannot be executed because it is either expired (max 6-hour validity) or invalid.</p>
          <div class="reason">${verification.reason || "Security verification failed"}</div>
          <a href="https://www.propremiumcare.com/admin/all-orders" class="btn">Open Medusa Admin Dashboard</a>
        </div>
      </body>
      </html>
    `
    res.status(403).send(errorHtml)
    return
  }

  // 2. Execute 1-Click Re-Authentication & Fulfillment Loop
  console.log("[PresignedRetry] 🚀 Executing 1-Click fulfillment retry triggered via presigned email link...")

  try {
    const cAny = req.scope as any
    const pgConnection = cAny.__pg_connection__ || 
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      throw new Error("Database connection unavailable in request container.")
    }

    let logId: any = null
    try {
      logId = await startJobLog(pgConnection, "manual-email-retry-fulfillment")
    } catch (_) {}

    // Step A: Force Re-Authentication
    console.log("[PresignedRetry] Authenticating with Shiprocket...")
    const activeToken = await shiprocketClient.authenticate()
    console.log("[PresignedRetry] ✅ Authenticated successfully. Token length:", activeToken.length)

    // Step B: Query unfulfilled orders from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const unfulfilledOrders = await pgConnection.raw(`
      SELECT o.id, o.display_id, o.email, o.created_at, o.status, pc.status as payment_status
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

    console.log(`[PresignedRetry] Found ${unfulfilledOrders.length} unfulfilled order(s) to process.`)

    const syncResults: Array<{ displayId: number; email: string; success: boolean; message: string; srOrderId?: string; shipmentId?: string }> = []
    let successCount = 0
    let failedCount = 0

    for (const ord of unfulfilledOrders) {
      if (ord.payment_status !== "completed") {
        console.warn(`[PresignedRetry] Skipping unpaid order #${ord.display_id} (${ord.payment_status})`)
        continue
      }

      console.log(`[PresignedRetry] Syncing Order #${ord.display_id}...`)
      try {
        const res = await syncOrderToShiprocket(ord.id, req.scope)
        if (res.success) {
          successCount++
          syncResults.push({
            displayId: ord.display_id,
            email: ord.email,
            success: true,
            message: res.message,
            srOrderId: res.order_id,
            shipmentId: res.shipment_id
          })
        } else {
          failedCount++
          syncResults.push({
            displayId: ord.display_id,
            email: ord.email,
            success: false,
            message: res.message
          })
        }
      } catch (err: any) {
        failedCount++
        syncResults.push({
          displayId: ord.display_id,
          email: ord.email,
          success: false,
          message: err.message
        })
      }
    }

    // Step C: Trigger live tracking status sync
    let statusSyncCount = 0
    try {
      const statusSyncRes = await syncAllShiprocketStatuses(req.scope, 30)
      statusSyncCount = statusSyncRes?.matchedCount || 0
    } catch (e: any) {
      console.warn("[PresignedRetry] Status sync warning:", e.message)
    }

    if (logId) {
      await finishJobLog(pgConnection, logId, {
        status: failedCount === 0 ? "success" : "warning",
        summary: `1-Click Email Retry: ${successCount} synced, ${failedCount} failed out of ${unfulfilledOrders.length} orders. Tracking checked: ${statusSyncCount}.`,
        details: { syncResults }
      })
    }

    const orderRowsHtml = syncResults.length > 0
      ? syncResults.map((r) => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 12px; font-weight: 700; color: #0f172a;">#${r.displayId}</td>
            <td style="padding: 12px; color: #475569; font-size: 13px;">${r.email}</td>
            <td style="padding: 12px; font-size: 12px;">
              ${r.success 
                ? `<span style="background: #dcfce7; color: #15803d; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">SYNCED</span>`
                : `<span style="background: #fee2e2; color: #b91c1c; font-weight: 600; padding: 2px 8px; border-radius: 9999px;">FAILED</span>`
              }
            </td>
            <td style="padding: 12px; font-size: 13px; color: #334155;">
              ${r.srOrderId ? `SR Order: <strong>${r.srOrderId}</strong>` : ''}
              ${r.shipmentId ? `<br/><span style="color: #64748b; font-size: 11px;">Shipment: ${r.shipmentId}</span>` : ''}
              ${!r.srOrderId && !r.shipmentId ? r.message : ''}
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" style="padding: 24px; text-align: center; color: #64748b;">No pending unfulfilled orders found. All orders in the last 7 days are already fulfilled!</td></tr>`

    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ProCare • 1-Click Fulfillment Complete</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; margin: 0; padding: 30px 16px; color: #334155; }
          .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; color: #ffffff; text-align: center; }
          .header h1 { margin: 8px 0 4px; font-size: 22px; font-weight: 700; }
          .header p { margin: 0; font-size: 13px; color: #94a3b8; }
          .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #4ade80; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
          .content { padding: 24px; }
          .metrics { display: flex; gap: 12px; margin-bottom: 24px; }
          .metric-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
          .metric-num { font-size: 26px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .metric-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; }
          .table-container { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: left; }
          th { background: #f8fafc; padding: 12px; font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          .footer { text-align: center; padding: 0 0 8px 0; }
          .btn { display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); }
          .btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">● SHIPROCKET RE-AUTH & SYNC COMPLETE</span>
            <h1>Fulfillment Action Successful</h1>
            <p>Executed at ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST via Presigned Security Link</p>
          </div>
          <div class="content">
            <div class="metrics">
              <div class="metric-box">
                <div class="metric-label">Total Scanned</div>
                <div class="metric-num">${unfulfilledOrders.length}</div>
              </div>
              <div class="metric-box" style="background: #f0fdf4; border-color: #bbf7d0;">
                <div class="metric-label" style="color: #166534;">Synced to SR</div>
                <div class="metric-num" style="color: #15803d;">${successCount}</div>
              </div>
              <div class="metric-box" style="background: ${failedCount === 0 ? '#f8fafc' : '#fef2f2'}; border-color: ${failedCount === 0 ? '#e2e8f0' : '#fecaca'};">
                <div class="metric-label" style="color: ${failedCount === 0 ? '#64748b' : '#b91c1c'};">Failed</div>
                <div class="metric-num" style="color: ${failedCount === 0 ? '#0f172a' : '#b91c1c'};">${failedCount}</div>
              </div>
            </div>

            <h3 style="font-size: 15px; margin: 0 0 12px; color: #0f172a;">Processed Orders Detail</h3>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Shiprocket IDs / Info</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderRowsHtml}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <a href="https://www.propremiumcare.com/admin/all-orders" class="btn" target="_blank">View All Orders in Medusa Admin →</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
    res.status(200).send(successHtml)
  } catch (err: any) {
    console.error("[PresignedRetry] Fatal error during retry action:", err.message)
    res.status(500).send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2 style="color: #dc2626;">Error Executing Fulfillment Retry</h2>
        <p style="color: #475569;">${err.message}</p>
        <p><a href="https://www.propremiumcare.com/admin/all-orders">Open Medusa Admin</a></p>
      </div>
    `)
  }
}
