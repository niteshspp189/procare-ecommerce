import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { DocumentText, Bolt } from "@medusajs/icons"
import { useState } from "react"

const OrderUnfulfilledBannerWidget = ({ data }: { data: any }) => {
  const [syncing, setSyncing] = useState(false)

  const isFulfilled = data.fulfillments && data.fulfillments.some((f: any) => !f.canceled_at)
  
  // If order is already fulfilled, do NOT show this top widget at all
  if (isFulfilled) {
    return null
  }

  const handleDownload = () => {
    window.open(`/admin/orders/${data.id}/invoice`, "_blank")
  }

  const handleSyncShiprocket = async () => {
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

  return (
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/50 border border-amber-200 rounded-lg shadow-xs">
      <div>
        <Heading level="h2" className="text-lg font-semibold text-amber-900 mb-0.5">
          Order Needs Shipping
        </Heading>
        <Text className="text-amber-700 text-xs">
          This order has not been dispatched to Shiprocket yet. Click to fulfill and register shipment.
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          size="small"
          isLoading={syncing}
          onClick={handleSyncShiprocket}
          className="bg-gray-900 hover:bg-black text-white font-medium flex items-center gap-x-1.5 px-3.5"
        >
          <Bolt className="w-3.5 h-3.5" />
          Fulfill & Sync to Shiprocket
        </Button>

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
