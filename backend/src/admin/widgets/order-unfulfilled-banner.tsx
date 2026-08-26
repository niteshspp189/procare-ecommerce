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

  // Extract payment collection and payments
  const pCollections = data.payment_collections || []
  const payments = Array.isArray(data.payments) && data.payments.length > 0 
    ? data.payments 
    : pCollections.flatMap((pc: any) => pc.payments || [])
  const primaryPayment = payments[0]
  const pData = primaryPayment?.data || {}
  const rzpPaymentId = pData.razorpay_payment_id || (pData.id && String(pData.id).startsWith("pay_") ? pData.id : null)

  const isCaptured = 
    pCollections.some((pc: any) => pc.status === "captured" || pc.status === "completed") ||
    data.payment_status === "captured" ||
    Boolean(primaryPayment?.captured_at)

  const isRefunded = 
    pCollections.some((pc: any) => pc.status === "refunded") ||
    data.payment_status === "refunded"

  const isAuthorized = 
    pCollections.some((pc: any) => pc.status === "authorized") ||
    data.payment_status === "authorized"

  let paymentText = "Razorpay: Unpaid / Not Captured"
  let badgeClasses = "bg-amber-100/90 text-amber-900 border-amber-300"

  if (isRefunded) {
    paymentText = `Razorpay: Refunded ${rzpPaymentId ? `(${rzpPaymentId})` : ""}`
    badgeClasses = "bg-purple-100 text-purple-900 border-purple-300"
  } else if (isCaptured) {
    paymentText = `Razorpay: Captured & Paid ${rzpPaymentId ? `(${rzpPaymentId})` : ""}`
    badgeClasses = "bg-emerald-100 text-emerald-900 border-emerald-300"
  } else if (isAuthorized) {
    paymentText = `Razorpay: Authorized / Uncaptured ${rzpPaymentId ? `(${rzpPaymentId})` : ""}`
    badgeClasses = "bg-amber-100 text-amber-900 border-amber-300"
  } else if (rzpPaymentId) {
    paymentText = `Razorpay ID: ${rzpPaymentId}`
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
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/60 border border-amber-200 rounded-lg shadow-xs">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Heading level="h2" className="text-base font-semibold text-amber-950">
            Order Needs Shipping
          </Heading>
          <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border ${badgeClasses}`}>
            {paymentText}
          </span>
        </div>
        <Text className="text-amber-800/90 text-xs">
          This order has not been dispatched to Shiprocket yet. {isCaptured ? "Click below to fulfill and register shipment." : "Please review payment status before dispatching."}
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
