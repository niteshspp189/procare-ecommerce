import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { DocumentText, Bolt, ArchiveBox } from "@medusajs/icons"
import { useEffect, useState } from "react"

const OrderUnfulfilledBannerWidget = ({ data }: { data: any }) => {
  const [syncing, setSyncing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [livePayment, setLivePayment] = useState<any>(null)

  const isFulfilled = data.fulfillments && data.fulfillments.some((f: any) => !f.canceled_at)
  
  // If order is already fulfilled, do NOT show this top widget at all
  if (isFulfilled) {
    return null
  }

  useEffect(() => {
    let isMounted = true
    fetch(`/admin/custom/orders/live-payment?order_id=${data.id}`, { credentials: "include" })
      .then(res => res.json())
      .then(resData => {
        if (isMounted && resData.success) {
          setLivePayment(resData)
        }
      })
      .catch(err => console.error("Error fetching live payment:", err))
    return () => { isMounted = false }
  }, [data.id])

  const handleDownload = () => {
    window.open(`/admin/orders/${data.id}/invoice`, "_blank")
  }

  const handleArchive = async () => {
    try {
      setArchiving(true)
      const res = await fetch("/admin/custom/orders/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: data.id, is_archived: true }),
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success("Order moved to Archived Orders!")
        setTimeout(() => {
          window.location.href = "/orders/archived-orders"
        }, 1000)
      } else {
        toast.error(resData.message || "Failed to archive order")
      }
    } catch (err: any) {
      toast.error(err.message || "Error archiving order")
    } finally {
      setArchiving(false)
    }
  }

  const handleSyncShiprocket = async () => {
    if (livePayment && livePayment.status === "refunded") {
      toast.error("Cannot fulfill: Order payment was refunded to the customer!")
      return
    }

    try {
      setSyncing(true)
      const res = await fetch("/admin/custom/orders/sync-shiprocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: data.id }),
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success("Order fulfilled and synced with Shiprocket successfully!")
        setTimeout(() => {
          window.location.reload()
        }, 1200)
      } else {
        toast.error(resData.message || "Failed to sync order with Shiprocket")
      }
    } catch (err: any) {
      toast.error(err.message || "Error syncing order")
    } finally {
      setSyncing(false)
    }
  }

  // Payment status badge presentation
  const isRefunded = livePayment?.badge_type === "refunded"
  const isCaptured = livePayment?.badge_type === "captured"
  const friendlyMsg = livePayment?.friendly_message || "Checking live payment status..."

  const containerBg = isRefunded 
    ? "bg-purple-50/60 border-purple-200" 
    : isCaptured 
    ? "bg-amber-50/60 border-amber-200"
    : "bg-gray-50 border-gray-200"

  const badgeBg = isRefunded
    ? "bg-purple-100 text-purple-900 border-purple-300"
    : isCaptured
    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
    : "bg-amber-100 text-amber-900 border-amber-300"

  return (
    <Container className={`p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border rounded-lg shadow-xs ${containerBg}`}>
      <div className="flex-1 pr-2">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Heading level="h2" className="text-base font-semibold text-ui-fg-base">
            {isRefunded 
              ? "Order Refunded — Do Not Fulfill" 
              : isCaptured 
              ? "Order Needs Shipping" 
              : "No Payment Recorded — Do Not Fulfill"}
          </Heading>

          <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border shadow-2xs ${badgeBg}`}>
            {friendlyMsg}
          </span>
        </div>

        <Text className="text-ui-fg-subtle text-xs">
          {isRefunded ? (
            <span className="text-purple-800 font-medium">
              ⚠️ This payment was refunded to the customer in Razorpay. Dispatching to Shiprocket is disabled to prevent loss. You can archive this order.
            </span>
          ) : isCaptured ? (
            <span className="text-amber-800">
              Payment is verified and captured in Razorpay. Click below to fulfill and push the shipment to Shiprocket.
            </span>
          ) : (
            <span className="text-amber-800 font-medium">
              ⚠️ No payment was recorded in payment gateway provider Razorpay for this order. Dispatching to Shiprocket is disabled. You can archive this order.
            </span>
          )}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {isCaptured ? (
          <Button
            size="small"
            isLoading={syncing}
            onClick={handleSyncShiprocket}
            className="bg-gray-900 hover:bg-black text-white font-medium flex items-center gap-x-1.5 px-3.5"
          >
            <Bolt className="w-3.5 h-3.5" />
            Fulfill & Sync to Shiprocket
          </Button>
        ) : (
          <Button
            size="small"
            variant="secondary"
            isLoading={archiving}
            onClick={handleArchive}
            className={`flex items-center gap-x-1.5 font-medium ${
              isRefunded 
                ? "text-purple-900 hover:bg-purple-100 border-purple-300" 
                : "text-amber-900 hover:bg-amber-100 border-amber-300"
            }`}
          >
            <ArchiveBox className="w-3.5 h-3.5" />
            Archive Order
          </Button>
        )}

        <Button variant="secondary" size="small" onClick={handleDownload} className="flex items-center gap-x-1.5">
          <DocumentText className="w-3.5 h-3.5" />
          Download PDF
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderUnfulfilledBannerWidget
