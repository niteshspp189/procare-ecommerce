import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard, ArrowPath, ArrowUpRightOnBox } from "@medusajs/icons"
import { Container, Heading, Table, Text, Button, toast, Drawer, Copy } from "@medusajs/ui"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"

const RazorpayTransactionsPage = () => {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all") // 'all', 'missing', 'created', 'refunded'
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const navigate = useNavigate()

  const fetchTransactions = () => {
    setLoading(true)
    fetch("/admin/razorpay/transactions", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        toast.error("Failed to load Razorpay transactions")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSync = async (cartId: string) => {
    setSyncing(cartId)
    try {
      const res = await fetch("/admin/razorpay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cart_id: cartId })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Order Synchronized", {
          description: "The order has been created successfully."
        })
        fetchTransactions()
      } else {
        toast.error("Sync Failed", {
          description: data.message || "Failed to sync order"
        })
      }
    } catch (err: any) {
      console.error(err)
      toast.error("Error syncing order")
    } finally {
      setSyncing(null)
    }
  }

  const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amountInPaise / 100)
  }

  const formatDateTime = (unixTimestamp: number) => {
    if (!unixTimestamp) return "-"
    const d = new Date(unixTimestamp * 1000)
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const filteredPayments = useMemo(() => {
    return payments.filter((p: any) => {
      // Tab filter
      if (activeTab === "missing") {
        if (!(p.status === "captured" && !p.medusa_order_display_id)) return false
      } else if (activeTab === "created") {
        if (!(p.status === "created" || p.status === "attempted")) return false
      } else if (activeTab === "refunded") {
        if (p.status !== "refunded" && !(p.amount_refunded && p.amount_refunded > 0)) return false
      }

      // Status dropdown filter
      if (statusFilter === "captured" && p.status !== "captured" && p.status !== "paid") return false
      if (statusFilter === "refunded" && p.status !== "refunded") return false
      if (statusFilter === "failed" && p.status !== "failed") return false
      if (statusFilter === "real" && (p.status === "created" || p.status === "attempted")) return false

      // Month filter
      if (monthFilter !== "all") {
        const d = new Date(p.created_at * 1000)
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (m !== monthFilter) return false
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchId = p.id?.toLowerCase().includes(q)
        const matchOrder = p.order_id?.toLowerCase().includes(q)
        const matchEmail = p.email?.toLowerCase().includes(q)
        const matchPhone = p.contact?.includes(q)
        const matchMedusa = p.medusa_order_display_id?.toLowerCase().includes(q)
        if (!matchId && !matchOrder && !matchEmail && !matchPhone && !matchMedusa) return false
      }

      return true
    })
  }, [payments, activeTab, statusFilter, monthFilter, search])

  return (
    <Container className="p-6 divide-y max-w-[1600px] mx-auto min-h-screen bg-ui-bg-subtle">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-ui-fg-muted" />
            <Heading level="h1" className="text-xl font-semibold">
              Razorpay Transactions
            </Heading>
          </div>
          <Text className="text-ui-fg-muted text-xs mt-1">
            Real-time audit log of Razorpay payment transactions with deep order verification and slide-over details.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={fetchTransactions} className="flex items-center gap-2">
            <ArrowPath className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="py-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button 
              onClick={() => setActiveTab("all")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "all" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-xs border" : "text-ui-fg-subtle hover:bg-ui-bg-base"}`}
            >
              All Transactions ({payments.length})
            </button>
            <button 
              onClick={() => setActiveTab("missing")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "missing" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-xs border" : "text-ui-fg-subtle hover:bg-ui-bg-base"}`}
            >
              Missing Medusa Orders
            </button>
            <button 
              onClick={() => setActiveTab("refunded")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "refunded" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-xs border" : "text-ui-fg-subtle hover:bg-ui-bg-base"}`}
            >
              Refunded
            </button>
            <button 
              onClick={() => setActiveTab("created")} 
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "created" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-xs border" : "text-ui-fg-subtle hover:bg-ui-bg-base"}`}
            >
              Incomplete / Abandoned
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search pay_id, email, phone, order..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs bg-ui-bg-base border border-ui-border-base rounded-md px-2.5 py-1 w-56 focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
            />

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-ui-bg-base border border-ui-border-base rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="real">Real (Captured/Refunded)</option>
              <option value="captured">Captured Only</option>
              <option value="refunded">Refunded Only</option>
              <option value="failed">Failed Only</option>
            </select>

            <select 
              value={monthFilter} 
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs bg-ui-bg-base border border-ui-border-base rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="all">All Months</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="2026-05">May 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="pt-4">
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden shadow-2xs">
          <Table>
            <Table.Header>
              <Table.Row className="bg-ui-bg-subtle hover:bg-ui-bg-subtle text-xs">
                <Table.HeaderCell>Date & Time</Table.HeaderCell>
                <Table.HeaderCell>Payment ID</Table.HeaderCell>
                <Table.HeaderCell>Customer / Contact</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Method</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Medusa Order</Table.HeaderCell>
                <Table.HeaderCell className="text-right w-24">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <td colSpan={8} className="text-center py-12 text-ui-fg-muted">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowPath className="w-4 h-4 animate-spin text-ui-fg-subtle" />
                      <Text className="text-xs">Loading Razorpay transactions...</Text>
                    </div>
                  </td>
                </Table.Row>
              ) : filteredPayments.length === 0 ? (
                <Table.Row>
                  <td colSpan={8} className="text-center py-12 text-ui-fg-muted">
                    <Text className="text-xs">No transactions match the selected filters.</Text>
                  </td>
                </Table.Row>
              ) : (
                filteredPayments.map((p: any) => {
                  const isCaptured = p.status === "captured" || p.status === "paid"
                  const isRefunded = p.status === "refunded"
                  const isFailed = p.status === "failed"

                  const badgeStyle = isRefunded
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : isCaptured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isFailed
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"

                  const dotStyle = isRefunded
                    ? "bg-purple-500"
                    : isCaptured
                    ? "bg-emerald-500"
                    : isFailed
                    ? "bg-rose-500"
                    : "bg-amber-500"

                  return (
                    <Table.Row 
                      key={p.id} 
                      onClick={() => setSelectedTx(p)}
                      className="cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                    >
                      {/* Date */}
                      <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                        {formatDateTime(p.created_at)}
                      </Table.Cell>

                      {/* Payment ID */}
                      <Table.Cell className="font-mono text-xs text-ui-fg-base whitespace-nowrap">
                        {p.id}
                      </Table.Cell>

                      {/* Customer / Contact */}
                      <Table.Cell className="text-xs">
                        <div className="flex flex-col max-w-[190px]">
                          <span className="text-ui-fg-base truncate">{p.email || p.medusa_cart?.email || "—"}</span>
                          <span className="text-ui-fg-muted text-[11px]">{p.contact || "—"}</span>
                        </div>
                      </Table.Cell>

                      {/* Amount */}
                      <Table.Cell className="font-medium text-xs text-ui-fg-base whitespace-nowrap">
                        {formatCurrency(p.amount)}
                      </Table.Cell>

                      {/* Method */}
                      <Table.Cell className="text-xs uppercase text-ui-fg-subtle">
                        {p.method || p.type || "N/A"}
                      </Table.Cell>

                      {/* Status */}
                      <Table.Cell className="text-xs whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyle}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyle}`} />
                          {p.status}
                        </span>
                      </Table.Cell>

                      {/* Medusa Order */}
                      <Table.Cell className="text-xs whitespace-nowrap">
                        {p.medusa_order_display_id ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation()
                              if (p.medusa_order_uuid) navigate(`/orders/${p.medusa_order_uuid}`)
                            }}
                            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {p.medusa_order_display_id}
                          </span>
                        ) : isCaptured ? (
                          <span className="text-rose-600 font-medium text-xs">Missing Order</span>
                        ) : (
                          <span className="text-ui-fg-muted text-xs">—</span>
                        )}
                      </Table.Cell>

                      {/* Action */}
                      <Table.Cell className="text-right whitespace-nowrap">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTx(p)
                          }}
                          className="text-xs py-1 px-2.5"
                        >
                          Details →
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
              )}
            </Table.Body>
          </Table>
        </div>
      </div>

      {/* Slide-over Transaction Details Drawer */}
      {selectedTx && (
        <Drawer open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
          <Drawer.Content className="right-2 inset-y-2 rounded-lg max-w-[550px] w-full bg-white shadow-xl border">
            <Drawer.Header className="border-b p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Drawer.Title className="text-lg font-semibold flex items-center gap-2">
                    Transaction Details
                  </Drawer.Title>
                  <Drawer.Description className="text-xs text-ui-fg-muted mt-0.5">
                    Live Razorpay Record & Medusa Cross-Reference
                  </Drawer.Description>
                </div>

                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${
                  selectedTx.status === "captured" || selectedTx.status === "paid"
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : selectedTx.status === "refunded"
                    ? "bg-purple-100 text-purple-900 border border-purple-300"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}>
                  {selectedTx.status}
                </span>
              </div>
            </Drawer.Header>

            <Drawer.Body className="p-6 overflow-y-auto space-y-6">
              {/* Financial Breakdown Card */}
              <div className="bg-ui-bg-subtle p-4 rounded-lg border border-ui-border-base space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-ui-border-base">
                  <Text className="text-xs text-ui-fg-muted font-medium">Transaction Amount</Text>
                  <Text className="text-xl font-bold text-ui-fg-base">{formatCurrency(selectedTx.amount)}</Text>
                </div>

                {selectedTx.fee > 0 && (
                  <div className="flex justify-between text-xs text-ui-fg-subtle">
                    <span>Razorpay Fee & GST</span>
                    <span>-₹{(selectedTx.fee / 100).toFixed(2)} {selectedTx.tax ? `(Tax: ₹${(selectedTx.tax / 100).toFixed(2)})` : ''}</span>
                  </div>
                )}

                {selectedTx.fee > 0 && (
                  <div className="flex justify-between text-xs font-medium text-ui-fg-base pt-1 border-t border-ui-border-base">
                    <span>Net Settled Amount</span>
                    <span>₹{((selectedTx.amount - selectedTx.fee) / 100).toFixed(2)}</span>
                  </div>
                )}

                {selectedTx.amount_refunded > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-purple-700 pt-1">
                    <span>Total Refunded to Customer</span>
                    <span>₹{(selectedTx.amount_refunded / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* IDs and References */}
              <div className="space-y-3">
                <Heading level="h3" className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted">
                  Identifiers & References
                </Heading>

                <div className="bg-white p-3 rounded-lg border border-ui-border-base space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-ui-fg-muted">Razorpay Payment ID:</span>
                    <div className="flex items-center gap-1 font-mono font-medium">
                      <span>{selectedTx.id}</span>
                      <Copy content={selectedTx.id} className="w-3.5 h-3.5 text-ui-fg-muted cursor-pointer" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-ui-fg-muted">Razorpay Order ID:</span>
                    <div className="flex items-center gap-1 font-mono">
                      <span>{selectedTx.order_id || selectedTx.id}</span>
                      <Copy content={selectedTx.order_id || selectedTx.id} className="w-3.5 h-3.5 text-ui-fg-muted cursor-pointer" />
                    </div>
                  </div>

                  {selectedTx.medusa_order_display_id && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-ui-fg-muted">Medusa Order:</span>
                      <button
                        onClick={() => {
                          if (selectedTx.medusa_order_uuid) navigate(`/orders/${selectedTx.medusa_order_uuid}`)
                        }}
                        className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {selectedTx.medusa_order_display_id}
                        <ArrowUpRightOnBox className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <Heading level="h3" className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted">
                  Payment Method & Customer
                </Heading>

                <div className="bg-white p-3 rounded-lg border border-ui-border-base space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ui-fg-muted">Method:</span>
                    <span className="font-medium uppercase">{selectedTx.method || selectedTx.type || "N/A"}</span>
                  </div>

                  {selectedTx.vpa && (
                    <div className="flex justify-between">
                      <span className="text-ui-fg-muted">UPI VPA:</span>
                      <span className="font-mono">{selectedTx.vpa}</span>
                    </div>
                  )}

                  {selectedTx.bank && (
                    <div className="flex justify-between">
                      <span className="text-ui-fg-muted">Bank:</span>
                      <span className="font-medium">{selectedTx.bank}</span>
                    </div>
                  )}

                  {selectedTx.card && (
                    <div className="flex justify-between">
                      <span className="text-ui-fg-muted">Card:</span>
                      <span>{selectedTx.card.network} •••• {selectedTx.card.last4} ({selectedTx.card.type})</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-ui-fg-muted">Customer Email:</span>
                    <span className="font-medium">{selectedTx.email || selectedTx.medusa_cart?.email || "—"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-ui-fg-muted">Customer Phone:</span>
                    <span>{selectedTx.contact || "—"}</span>
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-ui-fg-muted">Timestamp:</span>
                    <span>{formatDateTime(selectedTx.created_at)}</span>
                  </div>

                  {selectedTx.error_description && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs mt-2">
                      <strong>Gateway Error:</strong> {selectedTx.error_description} ({selectedTx.error_code})
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items if present */}
              {selectedTx.medusa_cart && selectedTx.medusa_cart.items?.length > 0 && (
                <div className="space-y-3">
                  <Heading level="h3" className="text-xs font-semibold uppercase tracking-wider text-ui-fg-muted">
                    Cart Items ({selectedTx.medusa_cart.items.length})
                  </Heading>

                  <div className="bg-white p-3 rounded-lg border border-ui-border-base space-y-2">
                    {selectedTx.medusa_cart.items.map((it: any) => (
                      <div key={it.id} className="flex justify-between items-center text-xs pb-1.5 border-b last:border-0 last:pb-0">
                        <div>
                          <span className="font-medium">{it.title}</span>
                          <span className="text-ui-fg-muted ml-2">× {it.quantity}</span>
                        </div>
                        <span className="font-semibold">₹{(Number(it.unit_price) * Number(it.quantity)).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Drawer.Body>

            <Drawer.Footer className="flex items-center justify-between p-4 border-t bg-ui-bg-subtle">
              <a
                href={`https://dashboard.razorpay.com/app/payments/${selectedTx.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-ui-fg-muted hover:text-ui-fg-base inline-flex items-center gap-1 underline"
              >
                Open in Razorpay Dashboard <ArrowUpRightOnBox className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <Drawer.Close asChild>
                  <Button variant="secondary" size="small" onClick={() => setSelectedTx(null)}>Close</Button>
                </Drawer.Close>

                {selectedTx.medusa_order_uuid && (
                  <Button 
                    size="small"
                    className="bg-gray-900 text-white"
                    onClick={() => navigate(`/orders/${selectedTx.medusa_order_uuid}`)}
                  >
                    Go to Order →
                  </Button>
                )}

                {selectedTx.status === "captured" && !selectedTx.medusa_order_display_id && selectedTx.medusa_cart?.id && (
                  <Button 
                    size="small"
                    isLoading={syncing === selectedTx.medusa_cart.id}
                    onClick={() => handleSync(selectedTx.medusa_cart.id)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Create Medusa Order
                  </Button>
                )}
              </div>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      )}

    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Transaction log",
  icon: CreditCard,
})

export default RazorpayTransactionsPage
