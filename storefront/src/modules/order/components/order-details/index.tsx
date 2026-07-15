"use client"

import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { formatDate, formatOrderDisplayId } from "@lib/util/format-date"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useState } from "react"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingError, setTrackingError] = useState<string | null>(null)

  const formatStatus = (str: string) => {
    const formatted = str.split("_").join(" ")
    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  // Extract tracking identifiers from fulfillments
  const trackingInfo = (() => {
    for (const f of (order.fulfillments ?? [])) {
      const data = (f as any).data as Record<string, any> | undefined
      const awb = data?.awb_code || (f as any).labels?.[0]?.tracking_number || (f as any).tracking_number || ""
      const shipmentId = data?.shiprocket_response?.shipment_id?.toString() || data?.shipment_id?.toString() || ""
      if (awb || shipmentId) return { awb, shipmentId }
    }
    return null
  })()

  const fetchTracking = async () => {
    if (!trackingInfo) return
    if (trackingOpen && trackingData) {
      setTrackingOpen(false)
      return
    }
    setTrackingOpen(true)
    if (trackingData) return
    setTrackingLoading(true)
    setTrackingError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
      const url = trackingInfo.awb
        ? `${backendUrl}/store/shiprocket/track?awb=${trackingInfo.awb}`
        : `${backendUrl}/store/shiprocket/track?shipment_id=${trackingInfo.shipmentId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch tracking from Shiprocket")
      const data = await res.json()
      const trackInfo = data?.tracking_data?.shipment_track?.[0] ||
        data?.data?.shipment_track?.[0] ||
        data?.shipment_track_activities ||
        (data?.tracking_data ? data.tracking_data : null)
      if (!trackInfo && !data?.current_status) {
        throw new Error("Tracking not available yet. Shipment may be pending pickup.")
      }
      setTrackingData(trackInfo || data)
    } catch (e: any) {
      const msg = e.message || "Unable to fetch tracking"
      setTrackingError(msg.includes("Failed to fetch") || msg.includes("Tracking not available") ? "No tracking data available yet." : msg)
    } finally {
      setTrackingLoading(false)
    }
  }

  const scans = trackingData?.scans || []
  const currentStatus = trackingData?.current_status || null
  const etd = trackingData?.etd || null

  return (
    <div>
      <Text>
        We have sent the order confirmation details to{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Order date:{" "}
        <span data-testid="order-date">
          {formatDate(order.created_at)}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Order number: <span data-testid="order-id">{formatOrderDisplayId(order.display_id ?? "")}</span>
      </Text>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-compact-small mt-4">
        {showStatus && (
          <>
            <Text>
              Order status:{" "}
              <span className="text-ui-fg-subtle" data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Payment status:{" "}
              <span className="text-ui-fg-subtle" data-testid="order-payment-status">
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {trackingInfo && (
            <button
              onClick={fetchTracking}
              className="flex items-center gap-1.5 bg-[#00b5a4] text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-[#009d8e] transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {trackingOpen ? "Hide Tracking" : "Track Order"}
            </button>
          )}
          <a
            href={`/api/invoice/${order.id}`}
            className="text-[#00b5a4] hover:text-[#009d8e] font-semibold underline text-xs"
          >
            Download Invoice (PDF)
          </a>
          <LocalizedClientLink
            href={`/account/support?order_id=${order.id}`}
            className="text-red-600 hover:text-red-700 font-semibold underline text-xs"
          >
            Raise Complaint
          </LocalizedClientLink>
        </div>
      </div>

      {/* Inline Tracking Panel */}
      {trackingOpen && (
        <div className="mt-4 border border-gray-200 rounded-2xl p-4 bg-slate-50/50 animate-fade-in">
          {trackingLoading && (
            <div className="flex items-center gap-3 py-4 justify-center">
              <div className="w-6 h-6 border-3 border-[#00b5a4] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Fetching shipment status...</span>
            </div>
          )}
          {trackingError && trackingError === "No tracking data available yet." ? (
            <div className="text-center py-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-sm text-slate-800 font-medium">
                No tracking data available yet.
              </p>
            </div>
          ) : trackingError && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
              <p className="font-semibold mb-1">Unable to fetch live updates</p>
              <p>{trackingError}</p>
              {trackingInfo?.awb && (
                <a href={`https://shiprocket.co/tracking/${trackingInfo.awb}`} target="_blank" rel="noopener noreferrer" className="underline font-bold mt-1 block">
                  Track on Shiprocket ↗
                </a>
              )}
            </div>
          )}
          {trackingData && !trackingLoading && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-x-1.5 items-center mb-1">
                {trackingInfo?.awb ? (
                  <span className="text-xs text-slate-500">AWB: <span className="font-mono font-bold text-slate-800">{trackingInfo.awb}</span></span>
                ) : (
                  <span className="text-xs text-slate-500">Shipment ID: <span className="font-mono font-bold text-slate-800">{trackingInfo?.shipmentId}</span>
                    <span className="ml-1 text-orange-500 font-semibold">(AWB pending)</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Status</p>
                  <p className="text-base font-black text-[#00b5a4] capitalize mt-0.5">{currentStatus || "In Transit"}</p>
                </div>
                {etd && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Delivery</p>
                    <p className="text-base font-black text-slate-800 mt-0.5">{etd}</p>
                  </div>
                )}
              </div>
              {scans.length > 0 && (
                <div className="flex flex-col gap-y-1 relative pl-4 border-l border-gray-200 ml-2">
                  {scans.slice(0, 5).map((scan: any, idx: number) => (
                    <div key={idx} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 ${idx === 0 ? "bg-[#00b5a4] border-white ring-3 ring-[#00b5a4]/20" : "bg-gray-300 border-white"}`} />
                      <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-0.5">
                        <div>
                          <span className={`text-xs font-bold ${idx === 0 ? "text-[#00b5a4]" : "text-slate-800"}`}>{scan.activity}</span>
                          {scan.location && <span className="text-[10px] text-slate-400 block">📍 {scan.location}</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">{scan.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderDetails
