import { MedusaContainer } from "@medusajs/framework/types"
import { syncOrderToShiprocket } from "../lib/shiprocket-sync"

export default async function nightlyAutoFulfillJob(container: MedusaContainer) {
  if (process.env.SHIPROCKET_ENV !== "production") {
    console.log("[NightlyAutoFulfillJob] Skipped: SHIPROCKET_ENV is not 'production'")
    return
  }

  console.log("[NightlyAutoFulfillJob] 🌙 Starting nightly Shiprocket fulfillment scan...")

  try {
    const cAny = container as any
    const pgConnection = cAny.__pg_connection__ || 
      (container.resolve ? container.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (container.resolve ? container.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      console.error("[NightlyAutoFulfillJob] Database connection unavailable")
      return
    }

    // Look for orders created in the last 7 days that are not canceled and have 0 fulfillments
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const unfulfilledOrders = await pgConnection.raw(`
      SELECT o.id, o.display_id, o.email, o.created_at, o.status
      FROM "order" o
      WHERE o.created_at >= ?
        AND o.status != 'canceled'
        AND NOT EXISTS (
          SELECT 1 FROM order_fulfillment of
          JOIN fulfillment f ON of.fulfillment_id = f.id
          WHERE of.order_id = o.id AND f.canceled_at IS NULL
        )
      ORDER BY o.display_id ASC;
    `, [sevenDaysAgo]).then((r: any) => r.rows || [])

    console.log(`[NightlyAutoFulfillJob] Found ${unfulfilledOrders.length} unfulfilled order(s) to process.`)

    let successCount = 0
    let failedCount = 0

    for (const ord of unfulfilledOrders) {
      console.log(`[NightlyAutoFulfillJob] Processing Order #${ord.display_id} (${ord.id})...`)
      const res = await syncOrderToShiprocket(ord.id, container)

      if (res.success) {
        successCount++
        console.log(`[NightlyAutoFulfillJob] ✅ Order #${ord.display_id}: ${res.message}`)
      } else {
        failedCount++
        console.error(`[NightlyAutoFulfillJob] ❌ Order #${ord.display_id} failed: ${res.message}`)
      }
    }

    console.log(`[NightlyAutoFulfillJob] Finished scan: ${successCount} synced, ${failedCount} failed out of ${unfulfilledOrders.length} total.`)
  } catch (error: any) {
    console.error("[NightlyAutoFulfillJob] Fatal error during nightly fulfillment scan:", error)
  }
}

export const config = {
  name: "nightly-shiprocket-fulfill",
  schedule: "0 20 * * *", // Runs every night at 20:00 UTC (1:30 AM IST)
}
