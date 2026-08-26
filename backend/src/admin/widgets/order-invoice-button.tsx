import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { DocumentText, Bolt, CheckCircle } from "@medusajs/icons"
import { useState } from "react"

const OrderActionsWidget = ({ data }: { data: any }) => {
  const [syncing, setSyncing] = useState(false)

  const handleDownload = () => {
    window.open(`/admin/orders/${data.id}/invoice`, "_blank")
  }

  const isFulfilled = data.fulfillments && data.fulfillments.some((f: any) => !f.canceled_at)
  const activeFulfillment = data.fulfillments?.find((f: any) => !f.canceled_at)
  const srData = activeFulfillment?.data

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
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div>
        <Heading level="h2" className="text-lg font-semibold mb-0.5">Order Management & Fulfillment</Heading>
        <Text className="text-gray-500 text-xs">
          {isFulfilled ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Synced with Shiprocket {srData?.shiprocket_order_id ? `(ID: ${srData.shiprocket_order_id})` : ""}
            </span>
          ) : (
            <span className="text-amber-600 font-medium">
              Needs Shipping — not yet registered with Shiprocket
            </span>
          )}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {!isFulfilled && (
          <Button
            size="small"
            isLoading={syncing}
            onClick={handleSyncShiprocket}
            className="bg-gray-900 hover:bg-black text-white font-medium flex items-center gap-x-1.5 px-3.5"
          >
            <Bolt className="w-3.5 h-3.5" />
            Fulfill & Sync to Shiprocket
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

export default OrderActionsWidget
