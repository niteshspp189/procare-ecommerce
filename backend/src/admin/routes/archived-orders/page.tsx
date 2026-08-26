import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Text, Button, Input, toast } from "@medusajs/ui"
import { ArrowDownTray, ArrowPath, DocumentText, Calendar, ArchiveBox, ArrowUturnLeft } from "@medusajs/icons"
import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"

export const config = defineRouteConfig({
  label: "Archived Orders",
  nested: "/orders",
})

export default function ArchivedOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>({
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [unarchivingOrderId, setUnarchivingOrderId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<string>("all_time")
  const [sortOrder, setSortOrder] = useState<"created_at_desc" | "created_at_asc" | "total_desc" | "total_asc">("created_at_desc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const navigate = useNavigate()

  const handleUnarchiveOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setUnarchivingOrderId(orderId)
      const res = await fetch("/admin/custom/orders/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: orderId, is_archived: false }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Order restored back to All Orders!")
        fetchArchivedOrders()
      } else {
        toast.error(data.message || "Failed to unarchive order")
      }
    } catch (err: any) {
      toast.error(err.message || "Error unarchiving order")
    } finally {
      setUnarchivingOrderId(null)
    }
  }

  const fetchArchivedOrders = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append("archived", "true")
      if (search) params.append("search", search)
      if (dateRange !== "all_time") params.append("date_range", dateRange)
      if (sortOrder) params.append("sort", sortOrder)

      const response = await fetch(`/admin/custom/orders?${params.toString()}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch archived orders")
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setStats(data.stats || { totalOrders: 0, totalRevenue: 0 })
      setCurrentPage(0)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Could not load archived orders")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArchivedOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, dateRange, sortOrder])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    const d = new Date(dateString)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Client-side pagination slice
  const paginatedOrders = useMemo(() => {
    const startIndex = currentPage * pageSize
    return orders.slice(startIndex, startIndex + pageSize)
  }, [orders, currentPage, pageSize])

  const totalPages = Math.ceil(orders.length / pageSize) || 1

  return (
    <Container className="p-6 divide-y max-w-[1600px] mx-auto min-h-screen bg-ui-bg-subtle">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ArchiveBox className="w-6 h-6 text-ui-fg-muted" />
            <Heading level="h1" className="text-xl font-semibold">
              Archived Orders
            </Heading>
          </div>
          <Text className="text-ui-fg-muted text-xs mt-1">
            Test and historical orders hidden from the main active orders dashboard. You can restore them anytime.
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="small"
            onClick={fetchArchivedOrders}
            className="flex items-center gap-2"
          >
            <ArrowPath className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-2xs">
          <Text className="text-ui-fg-muted text-xs font-medium uppercase tracking-wider">Archived Orders</Text>
          <Text className="text-2xl font-semibold mt-2">{stats.totalOrders}</Text>
        </div>

        <div className="p-4 bg-ui-bg-base border border-ui-border-base rounded-lg shadow-2xs">
          <Text className="text-ui-fg-muted text-xs font-medium uppercase tracking-wider">Archived Value</Text>
          <Text className="text-2xl font-semibold mt-2 text-ui-fg-subtle">{formatCurrency(stats.totalRevenue || 0)}</Text>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by order #, email, customer, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            className="w-full md:max-w-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Date Filter */}
          <div className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
            <Calendar className="w-3.5 h-3.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-ui-bg-base border border-ui-border-base rounded-md text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
            >
              <option value="all_time">All Time</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>
          </div>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-ui-bg-base border border-ui-border-base rounded-md text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-ui-border-interactive"
          >
            <option value="created_at_desc">Date: Newest First</option>
            <option value="created_at_asc">Date: Oldest First</option>
            <option value="total_desc">Total: Highest First</option>
            <option value="total_asc">Total: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="pt-4">
        <div className="bg-ui-bg-base border border-ui-border-base rounded-lg overflow-hidden shadow-2xs">
          <Table>
            <Table.Header>
              <Table.Row className="bg-ui-bg-subtle hover:bg-ui-bg-subtle text-xs">
                <Table.HeaderCell className="w-20">Order</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Items</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
                <Table.HeaderCell className="text-right w-36">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                <Table.Row>
                  <td colSpan={8} className="text-center py-12 text-ui-fg-muted">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowPath className="w-4 h-4 animate-spin text-ui-fg-subtle" />
                      <Text className="text-xs">Loading archived orders...</Text>
                    </div>
                  </td>
                </Table.Row>
              ) : paginatedOrders.length === 0 ? (
                <Table.Row>
                  <td colSpan={8} className="text-center py-12 text-ui-fg-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ArchiveBox className="w-8 h-8 text-ui-fg-subtle opacity-50" />
                      <Text className="text-xs font-medium">No archived orders found</Text>
                      <Text className="text-xs text-ui-fg-subtle">
                        To archive an order, click the archive button on any order row in the All Orders table.
                      </Text>
                    </div>
                  </td>
                </Table.Row>
              ) : (
                paginatedOrders.map((order) => (
                  <Table.Row
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="cursor-pointer hover:bg-ui-bg-subtle-hover transition-colors"
                  >
                    {/* Order ID */}
                    <Table.Cell className="font-medium text-xs text-ui-fg-base whitespace-nowrap">
                      {order.displayId}
                    </Table.Cell>

                    {/* Date */}
                    <Table.Cell className="text-xs text-ui-fg-subtle whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </Table.Cell>

                    {/* Customer */}
                    <Table.Cell className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-ui-fg-base">{order.customerName}</span>
                        <span className="text-ui-fg-subtle text-xs truncate max-w-[180px]">
                          {order.customerEmail}
                        </span>
                      </div>
                    </Table.Cell>

                    {/* Items */}
                    <Table.Cell className="text-xs text-ui-fg-subtle">
                      <div className="flex flex-col max-w-[220px]">
                        <span className="truncate text-ui-fg-base">{order.itemsSummary || "—"}</span>
                        {order.itemsCount > 1 && (
                          <span className="text-xs text-ui-fg-muted">
                            +{order.itemsCount - 1} more item(s)
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Payment */}
                    <Table.Cell className="text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        order.paymentState === "captured"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : order.paymentState === "refunded"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          order.paymentState === "captured" ? "bg-emerald-500" : "bg-amber-500"
                        }`} />
                        {order.paymentState === "captured" ? "Captured" : "Pending"}
                      </span>
                    </Table.Cell>

                    {/* Fulfillment */}
                    <Table.Cell className="text-xs">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        order.fulfillmentState === "fulfilled" || order.fulfillmentState === "shipped"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          order.fulfillmentState === "fulfilled" || order.fulfillmentState === "shipped"
                            ? "bg-emerald-500" : "bg-gray-400"
                        }`} />
                        {order.fulfillmentState === "fulfilled" || order.fulfillmentState === "shipped"
                          ? "Fulfilled" : "Not fulfilled"}
                      </span>
                    </Table.Cell>

                    {/* Total */}
                    <Table.Cell className="text-right text-xs text-ui-fg-base whitespace-nowrap">
                      {formatCurrency(order.total || 0)}
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={unarchivingOrderId === order.id}
                          onClick={(e) => handleUnarchiveOrder(order.id, e)}
                          title="Restore to All Orders"
                          className="px-2 py-1 text-xs text-ui-fg-base hover:text-emerald-700 hover:bg-emerald-50 border border-ui-border-base rounded transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowUturnLeft className="w-3.5 h-3.5" />
                          Unarchive
                        </button>

                        <a
                          href={`/admin/orders/${order.id}/invoice`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download Invoice PDF"
                          className="p-1 text-ui-fg-subtle hover:text-ui-fg-base rounded transition-colors inline-flex items-center"
                        >
                          <DocumentText className="w-4 h-4" />
                        </a>

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
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination Bar */}
        {orders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            <div className="text-xs text-ui-fg-muted">
              Showing{" "}
              <span className="font-medium text-ui-fg-base">
                {currentPage * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-ui-fg-base">
                {Math.min((currentPage + 1) * pageSize, orders.length)}
              </span>{" "}
              of <span className="font-medium text-ui-fg-base">{orders.length}</span>{" "}
              archived orders
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-ui-fg-muted mr-4">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(0)
                  }}
                  className="bg-ui-bg-base border border-ui-border-base rounded text-xs py-0.5 px-1 focus:outline-none"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>per page</span>
              </div>

              <Button
                variant="secondary"
                size="small"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>

              <Text className="text-xs text-ui-fg-muted px-2">
                Page {currentPage + 1} of {totalPages}
              </Text>

              <Button
                variant="secondary"
                size="small"
                disabled={currentPage >= totalPages - 1}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
