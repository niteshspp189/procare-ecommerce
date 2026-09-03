import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Badge,
  toast,
} from "@medusajs/ui"
import {
  Clock,
  ArrowPath,
  Bolt,
  CheckCircleSolid,
  XMark,
} from "@medusajs/icons"
import { useState, useEffect } from "react"

interface CronJobLogEntry {
  id: string | number
  job_name: string
  status: "success" | "warning" | "failed" | "running"
  started_at: string
  completed_at?: string | null
  duration_ms?: number | null
  summary?: string | null
  details?: any
}

interface ScheduledJobInfo {
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

interface CronStats {
  total_runs: number
  success_runs: number
  failed_runs: number
  warning_runs: number
  success_rate: number
  next_run: string
}

const CronJobsPage = () => {
  const [jobs, setJobs] = useState<ScheduledJobInfo[]>([])
  const [logs, setLogs] = useState<CronJobLogEntry[]>([])
  const [stats, setStats] = useState<CronStats>({
    total_runs: 0,
    success_runs: 0,
    failed_runs: 0,
    warning_runs: 0,
    success_rate: 100,
    next_run: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningManual, setIsRunningManual] = useState(false)
  const [selectedLog, setSelectedLog] = useState<CronJobLogEntry | null>(null)

  const fetchCronData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/admin/custom/cron-jobs", { credentials: "include" })
      const data = await res.json()
      if (data.success) {
        setJobs(data.jobs || [])
        setLogs(data.logs || [])
        if (data.stats) setStats(data.stats)
      } else {
        toast.error(data.message || "Failed to load cron job logs")
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Error loading cron jobs data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCronData()
  }, [])

  const handleRunNow = async () => {
    setIsRunningManual(true)
    toast.info("Triggering nightly sync job in background...")
    try {
      const res = await fetch("/admin/custom/cron-jobs", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || "Nightly job completed successfully!")
        await fetchCronData()
      } else {
        toast.error(data.message || "Failed to execute nightly job")
      }
    } catch (err: any) {
      toast.error(err.message || "Network error triggering nightly job")
    } finally {
      setIsRunningManual(false)
    }
  }

  const formatIST = (dateStr?: string | null) => {
    if (!dateStr) return "N/A"
    try {
      const d = new Date(dateStr)
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }) + " IST"
    } catch {
      return dateStr
    }
  }

  const formatDuration = (ms?: number | null) => {
    if (ms === null || ms === undefined) return "—"
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge color="green" className="font-semibold uppercase text-[11px]">Success</Badge>
      case "warning":
        return <Badge color="orange" className="font-semibold uppercase text-[11px]">Warning</Badge>
      case "failed":
        return <Badge color="red" className="font-semibold uppercase text-[11px]">Failed</Badge>
      case "running":
        return <Badge color="blue" className="font-semibold uppercase text-[11px] animate-pulse">Running</Badge>
      default:
        return <Badge color="grey">{status}</Badge>
    }
  }

  return (
    <div className="flex flex-col gap-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Heading level="h1" className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00b5a4]" />
            Scheduled Jobs & Logistics Logs
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Monitor background automated tasks, upcoming cron triggers, and historical Shiprocket fulfillment scans.
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={fetchCronData}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
          >
            <ArrowPath className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="small"
            onClick={handleRunNow}
            isLoading={isRunningManual}
            className="!bg-[#00b5a4] !border-[#00b5a4] hover:!bg-[#009d8e] text-white flex items-center gap-1.5 shadow-sm"
          >
            <Bolt className="w-4 h-4" />
            ⚡ Run Nightly Job Now
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Container className="p-4 flex flex-col justify-between border-l-4 border-l-[#00b5a4] shadow-sm">
          <Text className="text-ui-fg-muted text-xs font-semibold uppercase tracking-wider">Next Scheduled Run</Text>
          <div className="mt-2">
            <div className="text-lg font-bold text-ui-fg-base">Daily, 1:30 AM IST</div>
            <Text className="text-xs text-ui-fg-subtle mt-0.5">{formatIST(stats.next_run)}</Text>
          </div>
        </Container>

        <Container className="p-4 flex flex-col justify-between border-l-4 border-l-blue-500 shadow-sm">
          <Text className="text-ui-fg-muted text-xs font-semibold uppercase tracking-wider">Active Scheduled Jobs</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ui-fg-base">{jobs.length} Active</span>
            <Badge color="green" className="text-[10px]">HEALTHY</Badge>
          </div>
          <Text className="text-xs text-ui-fg-subtle mt-1">Shiprocket Auto-Fulfill & Tracking</Text>
        </Container>

        <Container className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500 shadow-sm">
          <Text className="text-ui-fg-muted text-xs font-semibold uppercase tracking-wider">Success Rate</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{stats.success_rate}%</span>
            <Text className="text-xs text-ui-fg-subtle">({stats.success_runs} of {stats.total_runs} runs)</Text>
          </div>
          <Text className="text-xs text-ui-fg-subtle mt-1">Razorpay & Shiprocket sync verified</Text>
        </Container>

        <Container className="p-4 flex flex-col justify-between border-l-4 border-l-amber-500 shadow-sm">
          <Text className="text-ui-fg-muted text-xs font-semibold uppercase tracking-wider">Lockout Alerts</Text>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ui-fg-base">Active</span>
            <Badge color="green" className="text-[10px]">SES CONNECTED</Badge>
          </div>
          <Text className="text-xs text-ui-fg-subtle mt-1">Alerts: niteshspp189@gmail.com</Text>
        </Container>
      </div>

      {/* Configured Jobs Card */}
      <Container className="p-0 overflow-hidden shadow-sm border border-ui-border-base">
        <div className="p-4 border-b border-ui-border-base bg-ui-bg-subtle flex items-center justify-between">
          <div>
            <Heading level="h2" className="text-base font-semibold">Active Cron Schedules</Heading>
            <Text className="text-xs text-ui-fg-subtle">Configured Medusa 2.0 background workers</Text>
          </div>
          <Badge color="green" className="flex items-center gap-1 font-medium">
            <CheckCircleSolid className="w-3 h-3 text-emerald-500" />
            Worker Process Running
          </Badge>
        </div>

        <div className="divide-y divide-ui-border-base">
          {jobs.map((job) => (
            <div key={job.name} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ui-bg-subtle-hover transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-ui-fg-base">{job.title}</span>
                  <code className="text-xs bg-ui-bg-component px-2 py-0.5 rounded border border-ui-border-base text-[#00b5a4] font-mono">
                    {job.schedule_cron}
                  </code>
                  <Badge color="green" className="text-[10px] uppercase font-bold">Active</Badge>
                </div>
                <Text className="text-xs text-ui-fg-subtle max-w-2xl">{job.description}</Text>
              </div>

              <div className="flex flex-col md:items-end text-xs text-ui-fg-subtle shrink-0">
                <div><strong>Schedule:</strong> {job.schedule_human}</div>
                <div><strong>Next Run:</strong> <span className="text-ui-fg-base font-medium">{formatIST(job.next_run)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* Execution Logs Table */}
      <Container className="p-0 overflow-hidden shadow-sm border border-ui-border-base">
        <div className="p-4 border-b border-ui-border-base bg-ui-bg-subtle flex items-center justify-between">
          <div>
            <Heading level="h2" className="text-base font-semibold">Execution History & Scan Logs</Heading>
            <Text className="text-xs text-ui-fg-subtle">Audit trail of recent background runs and fulfillment batches</Text>
          </div>
          <Text className="text-xs text-ui-fg-muted">Showing last {logs.length} runs</Text>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-ui-fg-muted text-sm">
            No execution logs recorded yet. Click <strong>"⚡ Run Nightly Job Now"</strong> above to trigger the first run!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="w-[180px]">Started (IST)</Table.HeaderCell>
                  <Table.HeaderCell className="w-[200px]">Job Name</Table.HeaderCell>
                  <Table.HeaderCell className="w-[110px]">Status</Table.HeaderCell>
                  <Table.HeaderCell className="w-[100px]">Duration</Table.HeaderCell>
                  <Table.HeaderCell>Execution Summary</Table.HeaderCell>
                  <Table.HeaderCell className="text-right w-[90px]">Details</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {logs.map((log) => (
                  <Table.Row key={log.id} className="hover:bg-ui-bg-subtle-hover">
                    <Table.Cell className="text-xs font-mono text-ui-fg-subtle whitespace-nowrap">
                      {formatIST(log.started_at)}
                    </Table.Cell>
                    <Table.Cell className="text-xs font-medium text-ui-fg-base">
                      {log.job_name}
                    </Table.Cell>
                    <Table.Cell>
                      {getStatusBadge(log.status)}
                    </Table.Cell>
                    <Table.Cell className="text-xs font-mono text-ui-fg-subtle">
                      {formatDuration(log.duration_ms)}
                    </Table.Cell>
                    <Table.Cell className="text-xs text-ui-fg-subtle max-w-md truncate">
                      {log.summary || "Completed execution"}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <Button
                        variant="secondary"
                        size="small"
                        className="text-xs !py-1 !px-2"
                        onClick={() => setSelectedLog(log)}
                      >
                        View
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Container>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-ui-bg-base border border-ui-border-base rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-ui-border-base flex items-center justify-between bg-ui-bg-subtle">
              <div className="flex items-center gap-2">
                <Heading level="h2" className="text-base font-bold">Job Execution Details</Heading>
                {getStatusBadge(selectedLog.status)}
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-ui-fg-subtle hover:text-ui-fg-base p-1 rounded"
              >
                <XMark className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-ui-fg-muted">Job:</span>
                  <div className="font-semibold text-ui-fg-base mt-0.5">{selectedLog.job_name}</div>
                </div>
                <div>
                  <span className="text-ui-fg-muted">Started At:</span>
                  <div className="font-mono text-ui-fg-base mt-0.5">{formatIST(selectedLog.started_at)}</div>
                </div>
                <div>
                  <span className="text-ui-fg-muted">Completed At:</span>
                  <div className="font-mono text-ui-fg-base mt-0.5">{formatIST(selectedLog.completed_at)}</div>
                </div>
                <div>
                  <span className="text-ui-fg-muted">Total Duration:</span>
                  <div className="font-mono text-ui-fg-base mt-0.5">{formatDuration(selectedLog.duration_ms)}</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">Summary</span>
                <div className="mt-1 p-3 bg-ui-bg-subtle rounded border border-ui-border-base text-xs font-medium text-ui-fg-base">
                  {selectedLog.summary || "No summary provided"}
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-xs font-semibold text-ui-fg-muted uppercase tracking-wider">Raw Payload & Metrics</span>
                  <pre className="mt-1 p-3 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-60 border border-slate-800">
                    {JSON.stringify(typeof selectedLog.details === "string" ? JSON.parse(selectedLog.details) : selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-ui-border-base flex justify-end bg-ui-bg-subtle">
              <Button variant="secondary" size="small" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CronJobsPage

