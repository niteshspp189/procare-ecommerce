import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Text, Button, Input, toast } from "@medusajs/ui"
import { ArrowDownTray, ArrowPath, DocumentText, Calendar, Bolt, ArchiveBox } from "@medusajs/icons"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"

export const config = defineRouteConfig({
  label: "All Orders",
  nested: "/orders",
})

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    completed: 0,
    needsShipping: 0,
    refundedOrReturned: 0,
    canceled: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null)
  const [archivingOrderId, setArchivingOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all_time")
  const [sortOrder, setSortOrder] = useState<"created_at_desc" | "created_at_asc" | "total_desc" | "total_asc">("created_at_desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const navigate = useNavigate()

  const handleSyncOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setSyncingOrderId(orderId)
      const res = await fetch("/admin/custom/orders/sync-shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Order fulfilled and synced with Shiprocket successfully!")
        fetchOrders()
      } else {
        toast.error(data.message || "Failed to sync order with Shiprocket")
      }
    } catch (err: any) {
      toast.error(err.message || "Error syncing order")
    } finally {
      setSyncingOrderId(null)
    }
  }

  const handleArchiveOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setArchivingOrderId(orderId)
      const res = await fetch("/admin/custom/orders/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: orderId, is_archived: true }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Order moved to Archived Orders!")
        fetchOrders()
      } else {
        toast.error(data.message || "Failed to archive order")
      }
    } catch (err: any) {
      toast.error(err.message || "Error archiving order")
    } finally {
      setArchivingOrderId(null)
    }
  }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        limit: "1000",
        offset: "0",
        search: search.trim(),
        status: statusFilter,
        date_range: dateRange,
        sort: sortOrder,
      })

      const res = await fetch(`/admin/custom/orders?${queryParams.toString()}`, {
        credentials: "include",
      })
      const data = await res.json()

      if (data && data.orders) {
        setOrders(data.orders)
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, dateRange, sortOrder])

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " INR"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const d = new Date(dateString)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const avgOrder = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case "today": return "Today"
      case "last_7_days": return "Last 7 days"
      case "last_30_days": return "Last 30 days"
      case "this_month": return "This month"
      default: return "All time"
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) return

    const headers = [
      "Order ID",
      "Display ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Customer Phone",
      "Payment Status",
      "Fulfillment Status",
      "Total (INR)",
      "Item Count",
    ]

    const rows = orders.map((o) => [
      o.id,
      o.displayId || `#${o.display_id || o.id.slice(-4)}`,
      formatDate(o.created_at),
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      o.customerEmail || "",
      o.customerPhone || "",
      o.paymentState || "",
      o.fulfillmentState || "",
      o.total || 0,
      o.items ? o.items.length : 0,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `ProCare_Orders_${statusFilter}_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Paginated slice
  const paginatedOrders = useMemo(() => {
    const start = currentPage * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, currentPage, pageSize])

  const totalPages = Math.ceil(orders.length / pageSize)

  return (
    <div className="w-full space-y-5">
      {/* ── 1. STATS CONTROLS BAR (Date Range Filter like Shopify) ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ui-fg-subtle uppercase tracking-wider">
            Analytics & Overview:
          </span>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-ui-fg-muted" />
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value)
              setCurrentPage(0)
            }}
            className="border border-ui-border-base rounded-md px-2.5 py-1.5 bg-white text-xs font-medium text-ui-fg-base cursor-pointer hover:border-gray-400 transition-colors focus:outline-hidden"
          >
            <option value="today">Today</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="this_month">This month</option>
            <option value="all_time">All time</option>
          </select>
        </div>
      </div>

      {/* ── 2. SUMMARY STATS CARDS (Clean Minimal Black & White Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <Container
          onClick={() => { setStatusFilter("all"); setCurrentPage(0); }}
          className={`cursor-pointer p-4 transition-all ${
            statusFilter === "all" ? "ring-2 ring-gray-900 border-gray-900" : "hover:border-gray-400"
          }`}
        >
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            Total Orders
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl font-semibold text-gray-900">
              {stats.totalOrders}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">{getDateRangeLabel()}</Text>
          </div>
        </Container>

        {/* Completed */}
        <Container
          onClick={() => { setStatusFilter("completed"); setCurrentPage(0); }}
          className={`cursor-pointer p-4 transition-all ${
            statusFilter === "completed" ? "ring-2 ring-gray-900 border-gray-900" : "hover:border-gray-400"
          }`}
        >
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            Completed
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl font-semibold text-gray-900">
              {stats.completed}
            </Heading>
            <Text size="xsmall" className="text-green-600 font-medium">Status</Text>
          </div>
        </Container>

        {/* Refund / Returned */}
        <Container
          onClick={() => { setStatusFilter("refunded"); setCurrentPage(0); }}
          className={`cursor-pointer p-4 transition-all ${
            statusFilter === "refunded" ? "ring-2 ring-gray-900 border-gray-900" : "hover:border-gray-400"
          }`}
        >
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            Refund/Returned
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl font-semibold text-gray-900">
              {stats.refundedOrReturned}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">Status</Text>
          </div>
        </Container>

        {/* Pending Fulfillment */}
        <Container
          onClick={() => { setStatusFilter("needs_shipping"); setCurrentPage(0); }}
          className={`cursor-pointer p-4 transition-all ${
            statusFilter === "needs_shipping" ? "ring-2 ring-gray-900 border-gray-900" : "hover:border-gray-400"
          }`}
        >
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            Pending Fulfillment
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl font-semibold text-gray-900">
              {stats.needsShipping}
            </Heading>
            <Text size="xsmall" className="text-green-600 font-medium">Needs Shipping</Text>
          </div>
        </Container>

        {/* Net Revenue */}
        <Container className="p-4">
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            Net Revenue
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl font-semibold text-gray-900">
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(stats.totalRevenue)}
            </Heading>
            <Text size="xsmall" className="text-green-600 font-medium">
              Avg: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(avgOrder)}
            </Text>
          </div>
        </Container>
      </div>

      {/* ── 3. MAIN ORDERS TABLE CONTAINER (Clean Medusa Native Style) ── */}
      <Container className="p-0 overflow-hidden">
        {/* Header & Controls */}
        <div className="p-4 border-b border-ui-border-base flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <Heading level="h1" className="text-base font-semibold text-ui-fg-base">
              Orders
            </Heading>
            <Text className="text-xs text-ui-fg-subtle">
              {orders.length} order{orders.length === 1 ? "" : "s"} {statusFilter !== "all" ? `(filtered)` : ""}
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleExportCSV}
            >
              <ArrowDownTray className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={fetchOrders}
            >
              <ArrowPath className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Clean Filter Tabs */}
        <div className="px-4 py-3 border-b border-ui-border-base bg-ui-bg-subtle/40 flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Orders", count: stats.totalOrders },
            { id: "needs_shipping", label: "Needs Shipping", count: stats.needsShipping },
            { id: "completed", label: "Completed", count: stats.completed },
            { id: "refunded", label: "Refund / Returned", count: stats.refundedOrReturned },
            { id: "payment_captured", label: "Payment Captured" },
            { id: "payment_pending", label: "Payment Pending" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setCurrentPage(0)
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    statusFilter === tab.id
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Sort Bar */}
        <div className="p-4 border-b border-ui-border-base flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Input
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order #, customer, email, phone..."
              className="bg-white"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-ui-fg-subtle">
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="border border-ui-border-base rounded-md p-1.5 bg-white text-xs text-ui-fg-base cursor-pointer focus:outline-hidden"
            >
              <option value="created_at_desc">Date: Newest First</option>
              <option value="created_at_asc">Date: Oldest First</option>
              <option value="total_desc">Amount: High to Low</option>
              <option value="total_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Order</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Date</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Customer</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Items</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Payment</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle">Fulfillment</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle text-right">Order Total</Table.HeaderCell>
              <Table.HeaderCell className="text-xs font-semibold text-ui-fg-subtle text-right"></Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {isLoading ? (
              <Table.Row>
                <td colSpan={8} className="text-center py-12 text-ui-fg-subtle text-xs">
                  Loading orders...
                </td>
              </Table.Row>
            ) : paginatedOrders.map((order) => (
              <Table.Row 
                key={order.id} 
                onClick={() => navigate(`/orders/${order.id}`)}
                className="cursor-pointer hover:bg-ui-bg-subtle/60 transition-colors group"
              >
                {/* Order ID */}
                <Table.Cell>
                  <span className="font-medium text-ui-fg-base group-hover:text-ui-fg-interactive">
                    {order.displayId}
                  </span>
                </Table.Cell>

                {/* Date */}
                <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                  {formatDate(order.created_at)}
                </Table.Cell>

                {/* Customer */}
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="font-normal text-xs text-ui-fg-base">
                      {order.customerName}
                    </span>
                    <span className="text-[11px] text-ui-fg-subtle truncate max-w-[180px]">
                      {order.customerEmail}
                    </span>
                    {order.customerPhone && order.customerPhone !== "-" && (
                      <span className="text-[10px] text-ui-fg-muted">
                        {order.customerPhone}
                      </span>
                    )}
                  </div>
                </Table.Cell>

                {/* Items */}
                <Table.Cell>
                  <div className="text-xs text-ui-fg-base">
                    <span>{order.items?.length || 0} item(s)</span>
                    {order.items && order.items[0] && (
                      <div className="text-[11px] text-ui-fg-subtle truncate max-w-[160px]" title={order.items[0].title}>
                        {order.items[0].title}
                        {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
                      </div>
                    )}
                  </div>
                </Table.Cell>

                {/* Payment */}
                <Table.Cell>
                  <div className="flex items-center gap-1.5 text-xs text-ui-fg-base">
                    {order.paymentState === "captured" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Captured</span>
                      </>
                    ) : order.paymentState === "refunded" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span>Refunded</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>Pending</span>
                      </>
                    )}
                  </div>
                </Table.Cell>

                {/* Fulfillment */}
                <Table.Cell>
                  <div className="flex items-center gap-1.5 text-xs text-ui-fg-base">
                    {order.fulfillmentState === "fulfilled" || order.fulfillmentState === "shipped" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Fulfilled</span>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        <span className="text-red-600 font-medium">Not fulfilled</span>
                        <button
                          type="button"
                          disabled={syncingOrderId === order.id}
                          onClick={(e) => handleSyncOrder(order.id, e)}
                          title="Fulfill and sync this order with Shiprocket immediately"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-900 hover:bg-black text-white rounded transition-colors disabled:opacity-50 cursor-pointer shadow-xs ml-1"
                        >
                          <Bolt className="w-2.5 h-2.5" />
                          {syncingOrderId === order.id ? "Syncing..." : "Sync"}
                        </button>
                      </div>
                    )}
                  </div>
                </Table.Cell>

                {/* Total */}
                <Table.Cell className="text-right text-xs text-ui-fg-base whitespace-nowrap">
                  {formatCurrency(order.total || 0)}
                </Table.Cell>

                {/* Actions */}
                <Table.Cell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {order.fulfillmentState === "not_fulfilled" && (
                      <button
                        type="button"
                        disabled={syncingOrderId === order.id}
                        onClick={(e) => handleSyncOrder(order.id, e)}
                        title="Sync with Shiprocket"
                        className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors inline-flex items-center"
                      >
                        <Bolt className="w-4 h-4" />
                      </button>
                    )}

                    <a
                      href={`/admin/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Download Invoice PDF"
                      className="p-1 text-ui-fg-subtle hover:text-ui-fg-base rounded transition-colors inline-flex items-center"
                    >
                      <DocumentText className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      disabled={archivingOrderId === order.id}
                      onClick={(e) => handleArchiveOrder(order.id, e)}
                      title="Archive Order (Move to Archived Orders)"
                      className="p-1 text-ui-fg-subtle hover:text-rose-600 hover:bg-rose-50 rounded transition-colors inline-flex items-center"
                    >
                      <ArchiveBox className="w-4 h-4" />
                    </button>

                    <Button
                      size="small"
                      variant="transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/orders/${order.id}`)
                      }}
                      className="text-xs text-ui-fg-subtle hover:text-ui-fg-base p-1"
                    >
                      View →
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}

            {!isLoading && paginatedOrders.length === 0 && (
              <Table.Row>
                <td colSpan={8} className="text-center py-12 text-ui-fg-subtle text-xs">
                  No orders found.
                </td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        {/* Pagination Footer */}
        {!isLoading && orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-ui-border-base px-4 py-3 bg-ui-bg-subtle/30">
            <div className="flex items-center gap-2 text-xs text-ui-fg-subtle">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(0)
                }}
                className="border border-ui-border-base rounded p-1 bg-white text-xs text-ui-fg-base"
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-ui-fg-subtle">
                Page {currentPage + 1} of {totalPages || 1}
              </span>
              <Button
                variant="secondary"
                size="small"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
