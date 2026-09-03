export interface CronJobLogEntry {
  id: string | number
  job_name: string
  status: "success" | "warning" | "failed" | "running"
  started_at: string
  completed_at?: string | null
  duration_ms?: number | null
  summary?: string | null
  details?: any
}

export interface ScheduledJobInfo {
  name: string
  title: string
  schedule: string
  schedule_cron: string
  schedule_human: string
  status: "active" | "paused" | "disabled"
  description: string
  last_run?: CronJobLogEntry | null
  next_run: string
}

export async function ensureCronTable(pgConnection: any) {
  try {
    await pgConnection.raw(`
      CREATE TABLE IF NOT EXISTS cron_job_log (
        id BIGSERIAL PRIMARY KEY,
        job_name VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        duration_ms INTEGER,
        summary TEXT,
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cron_job_log_job ON cron_job_log(job_name, started_at DESC);
    `)
  } catch (e) {
    // Already created
  }
}

export async function startJobLog(pgConnection: any, jobName: string): Promise<number | string> {
  await ensureCronTable(pgConnection)
  const res = await pgConnection("cron_job_log")
    .insert({
      job_name: jobName,
      status: "running",
      started_at: new Date(),
      created_at: new Date(),
    })
    .returning("id")

  return res[0]?.id || res[0]
}

export async function finishJobLog(
  pgConnection: any,
  logId: number | string,
  params: {
    status: "success" | "warning" | "failed"
    summary: string
    details?: any
  }
) {
  try {
    const started = await pgConnection("cron_job_log").where("id", logId).select("started_at").first()
    const startedAt = started?.started_at ? new Date(started.started_at).getTime() : Date.now()
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - startedAt

    await pgConnection("cron_job_log")
      .where("id", logId)
      .update({
        status: params.status,
        completed_at: completedAt,
        duration_ms: durationMs,
        summary: params.summary,
        details: params.details ? JSON.stringify(params.details) : null,
      })
  } catch (err: any) {
    console.error("[CronLogger] Failed to update log entry:", err.message)
  }
}

export async function getCronJobLogs(pgConnection: any, limit: number = 50): Promise<CronJobLogEntry[]> {
  await ensureCronTable(pgConnection)
  return await pgConnection("cron_job_log")
    .orderBy("started_at", "desc")
    .limit(limit)
}

export function getNextNightlyRun(): Date {
  const now = new Date()
  // Target: 20:30 UTC (2:00 AM IST next morning)
  const next = new Date(now)
  next.setUTCHours(20, 30, 0, 0)
  if (now.getTime() >= next.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1)
  }
  return next
}

export async function getRegisteredJobsInfo(pgConnection: any): Promise<ScheduledJobInfo[]> {
  const lastLog = await pgConnection("cron_job_log")
    .where("job_name", "nightly-shiprocket-fulfill")
    .orderBy("started_at", "desc")
    .first()

  const nextRun = getNextNightlyRun()

  return [
    {
      name: "nightly-shiprocket-fulfill",
      title: "Shiprocket Auto-Fulfillment & Tracking Sync",
      schedule: "30 20 * * *",
      schedule_cron: "30 20 * * *",
      schedule_human: "Daily at 2:00 AM IST (20:30 UTC)",
      status: "active",
      description: "Scans paid orders in the last 7 days, cross-verifies with Razorpay live API, dispatches shipments to Shiprocket, and pulls live AWB tracking statuses.",
      last_run: lastLog || null,
      next_run: nextRun.toISOString(),
    }
  ]
}
