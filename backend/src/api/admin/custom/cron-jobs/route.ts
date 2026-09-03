import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getCronJobLogs, getRegisteredJobsInfo, getNextNightlyRun } from "../../../../lib/cron-logger"
import nightlyAutoFulfillJob from "../../../../jobs/auto-fulfill-nightly"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pgConnection = (req.scope as any).__pg_connection__ || 
      (req.scope.resolve ? req.scope.resolve("__pg_connection__", { allowUnregistered: true }) : null) ||
      (req.scope.resolve ? req.scope.resolve("pg_connection", { allowUnregistered: true }) : null)

    if (!pgConnection) {
      return res.status(500).json({ success: false, message: "Database connection unavailable" })
    }

    const limit = parseInt((req.query.limit as string) || "50")
    const logs = await getCronJobLogs(pgConnection, limit)
    const jobs = await getRegisteredJobsInfo(pgConnection)
    const nextRun = getNextNightlyRun()

    const totalRuns = logs.length
    const successRuns = logs.filter((l) => l.status === "success").length
    const failedRuns = logs.filter((l) => l.status === "failed").length
    const warningRuns = logs.filter((l) => l.status === "warning").length

    return res.json({
      success: true,
      jobs,
      logs,
      stats: {
        total_runs: totalRuns,
        success_runs: successRuns,
        failed_runs: failedRuns,
        warning_runs: warningRuns,
        success_rate: totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100,
        next_run: nextRun.toISOString(),
      },
    })
  } catch (err: any) {
    console.error("[CronJobsAPI] Error:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[CronJobsAPI] Manually triggering nightlyAutoFulfillJob via Admin UI...")
    await nightlyAutoFulfillJob(req.scope as any)
    return res.json({
      success: true,
      message: "Nightly fulfillment & tracking sync job completed successfully.",
    })
  } catch (err: any) {
    console.error("[CronJobsAPI] Manual run failed:", err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
