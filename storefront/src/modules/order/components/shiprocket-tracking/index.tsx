"use client"

import { useState, useEffect } from "react"
import { Button, Heading, Text, clx } from "@medusajs/ui"

interface ScanEvent {
  date: string
  activity: string
  location: string
  "sr-status"?: string
}

interface ShiprocketTrackingProps {
  trackingNumber: string | null
  shipmentId?: string | null
}

const ShiprocketTracking = ({ trackingNumber, shipmentId }: ShiprocketTrackingProps) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchTracking = async () => {
    if (trackingData) {
      setIsOpen(!isOpen)
      return
    }

    setLoading(true)
    setError(null)
    setIsOpen(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
      let url: string
      if (trackingNumber) {
        url = `${backendUrl}/store/shiprocket/track?awb=${trackingNumber}`
      } else if (shipmentId) {
        url = `${backendUrl}/store/shiprocket/track?shipment_id=${shipmentId}`
      } else {
        throw new Error("No tracking identifier available")
      }

      const res = await fetch(url)
      
      if (!res.ok) {
        throw new Error("No tracking data available yet.")
      }
      
      const data = await res.json()
      // Support both AWB and shipment_id response shapes
      const trackInfo = data?.tracking_data?.shipment_track?.[0] ||
        data?.data?.shipment_track?.[0] ||
        data?.shipment_track_activities ||
        (data?.tracking_data ? data.tracking_data : null)
      if (!trackInfo && !data?.current_status) {
        throw new Error("No tracking data available yet.")
      }

      setTrackingData(trackInfo || data)
    } catch (err: any) {
      console.error("Error fetching tracking:", err)
      const msg = err.message || "Something went wrong while fetching tracking info"
      setError(msg.includes("Failed to fetch") || msg.includes("No tracking details") ? "No tracking data available yet." : msg)
    } finally {
      setLoading(false)
    }
  }

  const scans: ScanEvent[] = trackingData?.scans || []
  const currentStatus = trackingData?.current_status || null
  const etd = trackingData?.etd || null

  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-slate-50/50 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Text className="txt-medium-plus text-ui-fg-base mb-1 font-bold">
            Shipment Tracking
          </Text>
          {trackingNumber ? (
            <Text className="txt-medium text-ui-fg-subtle">
              AWB: <span className="font-mono font-bold text-gray-900">{trackingNumber}</span>
            </Text>
          ) : shipmentId ? (
            <Text className="txt-medium text-ui-fg-subtle">
              Shipment ID: <span className="font-mono font-bold text-gray-900">{shipmentId}</span>
              <span className="ml-2 text-xs text-orange-500 font-semibold">(AWB pending assignment)</span>
            </Text>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchTracking}
            variant="secondary"
            className="!bg-[#00b5a4] !text-white !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full px-5 text-xs py-1.5"
          >
            {isOpen ? "Hide Tracking" : "Track Delivery"}
          </Button>
          {trackingNumber && (
            <a
              href={`https://shiprocket.co/tracking/${trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white border border-gray-200 text-gray-700 px-5 py-1.5 rounded-full font-bold hover:bg-gray-50 transition-all text-xs"
            >
              External Portal ↗
            </a>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-gray-200 transition-all animate-fade-in">
          {loading && (
            <div className="flex flex-col items-center py-6 gap-2">
              <div className="w-8 h-8 border-4 border-[#00b5a4] border-t-transparent rounded-full animate-spin"></div>
              <Text className="text-xs text-slate-500 font-medium">Fetching real-time shipment status...</Text>
            </div>
          )}

          {error && error === "No tracking data available yet." ? (
            <div className="text-center py-4 bg-white border border-gray-100 rounded-xl">
              <Text className="text-sm text-slate-800 font-medium">
                No tracking data available yet.
              </Text>
            </div>
          ) : error && (
            <div className="bg-red-50/80 border border-red-100 rounded-xl p-4 text-xs text-red-700 flex flex-col gap-2">
              <p className="font-semibold">Unable to fetch live updates</p>
              <p>{error}</p>
              <p className="mt-1">
                You can track this shipment directly via the{" "}
                <a
                  href={`https://shiprocket.co/tracking/${trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-bold hover:text-red-900"
                >
                  Shiprocket Tracking Link
                </a>.
              </p>
            </div>
          )}

          {trackingData && !loading && (
            <div className="flex flex-col gap-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Status</Text>
                  <Text className="text-lg font-black text-[#00b5a4] capitalize mt-0.5">{currentStatus || "In Transit"}</Text>
                </div>
                {etd && (
                  <div>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Delivery</Text>
                    <Text className="text-lg font-black text-slate-800 mt-0.5">{etd}</Text>
                  </div>
                )}
              </div>

              {/* Timeline list */}
              {scans.length > 0 ? (
                <div className="flex flex-col gap-y-1 relative pl-4 border-l border-gray-200 ml-3">
                  {scans.map((scan, idx) => {
                    const isLatest = idx === 0
                    return (
                      <div key={idx} className="relative pb-6 last:pb-0">
                        {/* Dot indicator */}
                        <div
                          className={clx(
                            "absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 transition-colors",
                            isLatest
                              ? "bg-[#00b5a4] border-white ring-4 ring-[#00b5a4]/20"
                              : "bg-gray-300 border-white"
                          )}
                        />
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-1">
                          <div className="flex flex-col">
                            <span className={clx("text-sm font-bold", isLatest ? "text-[#00b5a4]" : "text-slate-800")}>
                              {scan.activity}
                            </span>
                            {scan.location && (
                              <span className="text-xs text-slate-400 font-medium">
                                Location: {scan.location}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap bg-white px-2 py-0.5 border border-gray-100 rounded font-medium mt-1 sm:mt-0">
                            {scan.date}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-white border border-gray-100 rounded-xl">
                  <Text className="text-xs text-slate-500 font-medium">
                    Order has been handed over. Live tracking updates will appear shortly.
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ShiprocketTracking
