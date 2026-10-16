import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { CheckCircle, Clock, CurrencyDollar, ArrowPath } from "@medusajs/icons"
import { useState } from "react"

const OrderPartialPaymentWidget = ({ data }: { data: any }) => {
  const metadata = data.metadata || {}
  const isPartial = metadata.payment_mode === "partial_cod" || metadata.is_partial === true

  const [loading, setLoading] = useState(false)
  const [isCollected, setIsCollected] = useState(Boolean(metadata.cod_balance_collected))

  // Only render for Partial COD orders
  if (!isPartial) {
    return null
  }

  const advancePaid = Number(metadata.advance_paid) || 0
  const codBalance = Number(metadata.cod_balance) || 0
  const partialPct = Number(metadata.partial_percentage) || 15
  const razorpayPayId = metadata.razorpay_payment_id || "Online"

  const handleToggleCollected = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/admin/custom/orders/${data.id}/partial-cod-collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        setIsCollected(resData.cod_balance_collected)
        toast.success(
          resData.cod_balance_collected
            ? `Doorstep COD balance of ₹${codBalance} marked as Collected!`
            : "COD status set to Pending Delivery Collection"
        )
        setTimeout(() => {
          window.location.reload()
        }, 800)
      } else {
        toast.error(resData.error || "Failed to update collection status")
      }
    } catch (err: any) {
      toast.error(err.message || "Network error updating COD status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="p-6 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <Heading level="h2" className="text-base font-semibold text-gray-900">
              Partial Payment (Partial COD) Breakdown
            </Heading>
            <Badge color={isCollected ? "green" : "orange"} size="small" className="font-medium">
              {isCollected ? "Fully Settled" : "Doorstep COD Pending"}
            </Badge>
          </div>
          <Text className="text-gray-500 text-xs mt-1">
            Customer paid {partialPct}% online advance via Razorpay; remaining balance is collected by courier upon delivery.
          </Text>
        </div>

        <Button
          variant={isCollected ? "secondary" : "primary"}
          size="small"
          isLoading={loading}
          onClick={handleToggleCollected}
          className="shrink-0"
        >
          {isCollected ? (
            <>
              <ArrowPath className="w-3.5 h-3.5 mr-1" />
              Mark as Pending
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Mark ₹{codBalance} as Collected
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Advance Online Deposit */}
        <div className="p-3 bg-emerald-50/60 rounded-md border border-emerald-100">
          <Text className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
            1. Advance Paid Online
          </Text>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-emerald-700">₹{advancePaid}</span>
            <span className="text-xs text-emerald-600">({partialPct}%)</span>
          </div>
          <Text className="text-[11px] text-emerald-600 mt-1 truncate">
            Razorpay ID: {razorpayPayId}
          </Text>
        </div>

        {/* Doorstep COD Balance */}
        <div className={`p-3 rounded-md border ${isCollected ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/60 border-amber-100"}`}>
          <Text className={`text-xs font-semibold uppercase tracking-wider ${isCollected ? "text-emerald-800" : "text-amber-800"}`}>
            2. Doorstep COD Balance
          </Text>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl font-bold ${isCollected ? "text-emerald-700" : "text-amber-700"}`}>
              ₹{codBalance}
            </span>
            <span className={`text-xs ${isCollected ? "text-emerald-600" : "text-amber-600"}`}>
              ({100 - partialPct}%)
            </span>
          </div>
          <Text className={`text-[11px] mt-1 ${isCollected ? "text-emerald-600" : "text-amber-600"}`}>
            {isCollected ? "Collected on Delivery" : "Collect on Delivery via Courier"}
          </Text>
        </div>

        {/* Settlement Status */}
        <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
          <Text className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            3. Settlement Status
          </Text>
          <div className="flex items-center gap-1.5 mt-2">
            {isCollected ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-emerald-700">100% Fully Received</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold text-amber-700">Awaiting Courier Delivery</span>
              </>
            )}
          </div>
          <Text className="text-[11px] text-gray-500 mt-1">
            {isCollected
              ? "Both advance & doorstep COD balance received."
              : "Shiprocket webhook or nightly sync marks this when delivered."}
          </Text>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.before",
})

export default OrderPartialPaymentWidget
