"use client"

import { useState } from "react"
import { Button, Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { formatDate, formatOrderDisplayId } from "@lib/util/format-date"

// Extract tracking info from an order's fulfillments
function getOrderTracking(order: HttpTypes.StoreOrder) {
  for (const f of (order.fulfillments ?? [])) {
    const data = (f as any).data as Record<string, any> | undefined
    const awb = data?.awb_code || (f as any).labels?.[0]?.tracking_number || (f as any).tracking_number || ""
    const shipmentId = data?.shiprocket_response?.shipment_id?.toString() || data?.shipment_id?.toString() || ""
    if (awb || shipmentId) return { awb, shipmentId }
  }
  return null
}

// Tracking Popup Modal
function TrackingPopup({ tracking, onClose }: { tracking: { awb: string; shipmentId: string }, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTracking = async () => {
    if (data) return
    setLoading(true)
    setError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
      const url = tracking.awb
        ? `${backendUrl}/store/shiprocket/track?awb=${tracking.awb}`
        : `${backendUrl}/store/shiprocket/track?shipment_id=${tracking.shipmentId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch tracking")
      const json = await res.json()
      const trackInfo = json?.tracking_data?.shipment_track?.[0] ||
        json?.data?.shipment_track?.[0] ||
        json?.shipment_track_activities ||
        (json?.tracking_data ? json.tracking_data : null)
      if (!trackInfo && !json?.current_status) throw new Error("No tracking data yet. Shipment may be pending pickup.")
      setData(trackInfo || json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useState(() => { fetchTracking() })

  const scans = data?.scans || []
  const currentStatus = data?.current_status || null
  const etd = data?.etd || null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Shipment Tracking</h3>
            {tracking.awb ? (
              <p className="text-xs text-slate-500 font-mono mt-0.5">AWB: <span className="font-bold text-slate-800">{tracking.awb}</span></p>
            ) : (
              <p className="text-xs text-slate-500 font-mono mt-0.5">Shipment ID: <span className="font-bold text-slate-800">{tracking.shipmentId}</span>
                <span className="ml-1 text-orange-500">(AWB pending)</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-8">
              <div className="w-7 h-7 border-3 border-[#00b5a4] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Fetching live status...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
              <p className="font-semibold mb-1">Unable to fetch live updates</p>
              <p>{error}</p>
              {tracking.awb && (
                <a href={`https://shiprocket.co/tracking/${tracking.awb}`} target="_blank" rel="noopener noreferrer" className="underline font-bold mt-1 block">
                  Track on Shiprocket ↗
                </a>
              )}
            </div>
          )}
          {data && !loading && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</p>
                  <p className="text-base font-black text-[#00b5a4] capitalize mt-0.5">{currentStatus || "In Transit"}</p>
                </div>
                {etd && (
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Est. Delivery</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{etd}</p>
                  </div>
                )}
              </div>
              {scans.length > 0 && (
                <div className="relative pl-4 border-l border-gray-200 ml-2">
                  {scans.slice(0, 6).map((scan: any, idx: number) => (
                    <div key={idx} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full border-2 ${idx === 0 ? "bg-[#00b5a4] border-white" : "bg-gray-300 border-white"}`} />
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${idx === 0 ? "text-[#00b5a4]" : "text-slate-800"}`}>{scan.activity}</span>
                        {scan.location && <span className="text-[10px] text-slate-400">📍 {scan.location}</span>}
                        <span className="text-[10px] text-slate-500">{scan.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tracking.awb && (
                <a href={`https://shiprocket.co/tracking/${tracking.awb}`} target="_blank" rel="noopener noreferrer"
                  className="text-center text-xs text-[#00b5a4] font-bold underline hover:text-[#009d8e]">
                  View Full Tracking on Shiprocket ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [activeTracking, setActiveTracking] = useState<{ awb: string; shipmentId: string } | null>(null)

  if (orders?.length) {
    return (
      <div className="w-full">
        {/* View Mode Toggle Switcher */}
        <div className="flex justify-end gap-x-2 mb-6">
          <button
            onClick={() => setViewMode("card")}
            title="Cards View"
            className={clx(
              "p-2 rounded-full transition-all border",
              viewMode === "card"
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          </button>
          <button
            onClick={() => setViewMode("table")}
            title="Scroll Table View"
            className={clx(
              "p-2 rounded-full transition-all border",
              viewMode === "table"
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4" cy="6" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="4" cy="18" r="1.5" /></svg>
          </button>
        </div>

        {viewMode === "card" ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const numberOfLines = order.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
              const tracking = getOrderTracking(order)

              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-y-3">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                    <span className="font-black text-lg text-slate-900">{formatOrderDisplayId(order.display_id ?? "")}</span>
                    <div className="flex items-center gap-x-1.5 bg-gray-50 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <div className={clx("h-1.5 w-1.5 rounded-full", {
                        "bg-green-500": order.fulfillment_status === "fulfilled",
                        "bg-orange-500": order.fulfillment_status === "not_fulfilled",
                        "bg-red-500": order.fulfillment_status === "canceled",
                      })} />
                      <span className="capitalize text-slate-600">{order.fulfillment_status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs py-2">
                    <span className="text-slate-400 font-medium">Date</span>
                    <span className="text-slate-700 text-right">{formatDate(order.created_at)}</span>
                    <span className="text-slate-400 font-medium">Amount</span>
                    <span className="text-[#00b5a4] font-bold text-right">
                      {convertToLocale({
                        amount: order.total,
                        currency_code: order.currency_code,
                      })}
                    </span>
                    <span className="text-slate-400 font-medium">Items</span>
                    <span className="text-slate-700 text-right">{numberOfLines} {numberOfLines > 1 ? "items" : "item"}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100 mt-auto flex-wrap">
                    <LocalizedClientLink href={`/account/orders/details/${order.id}`} className="flex-1 min-w-[80px]">
                      <Button variant="secondary" className="w-full !bg-[#00b5a4] !text-white !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full text-xs py-2">
                        Details
                      </Button>
                    </LocalizedClientLink>
                    {tracking && (
                      <button
                        onClick={() => setActiveTracking(tracking)}
                        className="flex-1 min-w-[80px] flex items-center justify-center gap-1 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-all text-xs py-2"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Track
                      </button>
                    )}
                    <a
                      href={`/api/invoice/${order.id}`}
                      className="flex-1 min-w-[80px] flex items-center justify-center bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-all text-xs py-2"
                    >
                      Invoice
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View (Horizontally Scrollable on Mobile) */
          <div className="w-full overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
            <table className="w-full min-w-[750px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Items</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const numberOfLines = order.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0
                  const tracking = getOrderTracking(order)

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="p-4 font-black text-slate-900">{formatOrderDisplayId(order.display_id ?? "")}</td>
                      <td className="p-4 text-slate-500">{formatDate(order.created_at)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-x-2">
                          <div className={clx("h-2 w-2 rounded-full", {
                            "bg-green-500": order.fulfillment_status === "fulfilled",
                            "bg-orange-500": order.fulfillment_status === "not_fulfilled",
                            "bg-red-500": order.fulfillment_status === "canceled",
                          })} />
                          <span className="capitalize text-slate-700">{order.fulfillment_status.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#00b5a4]">
                        {convertToLocale({
                          amount: order.total,
                          currency_code: order.currency_code,
                        })}
                      </td>
                      <td className="p-4 text-slate-500">{numberOfLines} {numberOfLines > 1 ? "items" : "item"}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-x-2">
                          <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                            <Button variant="secondary" className="!bg-[#00b5a4] !text-white !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full px-4 py-1.5 text-xs">
                              Details
                            </Button>
                          </LocalizedClientLink>
                          {tracking && (
                            <button
                              onClick={() => setActiveTracking(tracking)}
                              className="flex items-center gap-1 bg-slate-800 text-white px-4 py-1.5 rounded-full font-bold hover:bg-slate-700 transition-all text-xs"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              Track
                            </button>
                          )}
                          <a
                            href={`/api/invoice/${order.id}`}
                            className="flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full font-bold hover:bg-gray-200 transition-all text-xs"
                          >
                            Invoice
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tracking Popup Modal */}
        {activeTracking && (
          <TrackingPopup
            tracking={activeTracking}
            onClose={() => setActiveTracking(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">Nothing to see here</h2>
      <p className="text-base-regular">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button className="!bg-[#00b5a4] !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full px-8">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
