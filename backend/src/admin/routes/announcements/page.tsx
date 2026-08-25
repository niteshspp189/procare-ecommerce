import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button, toast } from "@medusajs/ui"
import { Sparkles, ArrowPath, Trash, Plus } from "@medusajs/icons"
import { useEffect, useState } from "react"

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState("")

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const res = await fetch("/admin/custom/announcements", { credentials: "include" })
      const data = await res.json()
      if (data && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements)
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleAdd = (customText?: string) => {
    const textToAdd = (customText || newItem).trim()
    if (!textToAdd) return
    setAnnouncements((prev) => [...prev, textToAdd])
    if (!customText) setNewItem("")
  }

  const handleRemove = (index: number) => {
    setAnnouncements((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdate = (index: number, value: string) => {
    setAnnouncements((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    if ((direction === "up" && index === 0) || (direction === "down" && index === announcements.length - 1)) {
      return
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1
    const updated = [...announcements]
    const [moved] = updated.splice(index, 1)
    updated.splice(targetIndex, 0, moved)
    setAnnouncements(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/custom/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ announcements }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Announcements updated successfully!")
        fetchAnnouncements()
      } else {
        toast.error(data.message || "Failed to update announcements")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-y-6">
      {/* ── Header ── */}
      <Container className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Heading level="h1" className="text-lg font-semibold text-ui-fg-base">
            Store Announcements & Top Banner
          </Heading>
          <Text className="text-ui-fg-subtle text-xs mt-0.5">
            Manage offers, coupon codes, and shipping messages rotating in the top marquee of the storefront.
          </Text>
        </div>

        <Button
          variant="secondary"
          size="small"
          isLoading={saving}
          onClick={handleSave}
          className="bg-gray-900 text-white hover:bg-black border-transparent font-medium px-4"
        >
          Save & Publish
        </Button>
      </Container>

      {/* ── Live Preview (Clean Subtle Gray) ── */}
      <Container className="p-4 bg-gray-50 border border-ui-border-base rounded-xl overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ui-fg-subtle">
            Live Marquee Preview
          </span>
          <span className="text-[10px] text-ui-fg-muted font-mono">{announcements.length} active message(s)</span>
        </div>

        <div className="py-2 overflow-hidden relative">
          {announcements.length === 0 ? (
            <div className="text-center text-ui-fg-muted text-xs py-1 italic">
              No announcements configured. Add items below to display them on your store.
            </div>
          ) : (
            <div className="flex items-center gap-8 overflow-x-auto no-scrollbar whitespace-nowrap text-xs font-semibold text-gray-900 uppercase tracking-wider">
              {announcements.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
                  <span>{item.replace(/\{threshold\}/g, "499")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* ── Announcements Editor ── */}
      <Container className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ui-border-base">
          <Heading level="h2" className="text-xs font-semibold text-ui-fg-base uppercase tracking-wider">
            Active Offers & Messages
          </Heading>
          <Text className="text-[11px] text-ui-fg-muted">
            Use <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">{"{threshold}"}</code> for dynamic free shipping minimum.
          </Text>
        </div>

        {loading ? (
          <div className="py-8 text-center text-ui-fg-subtle text-xs">Loading announcements...</div>
        ) : (
          <div className="space-y-2.5">
            {announcements.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 bg-white border border-ui-border-base rounded-md hover:border-gray-400 transition-colors"
              >
                {/* Up/Down buttons */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "up")}
                    className="text-[10px] text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === announcements.length - 1}
                    onClick={() => handleMove(idx, "down")}
                    className="text-[10px] text-gray-400 hover:text-gray-900 disabled:opacity-20 cursor-pointer"
                  >
                    ▼
                  </button>
                </div>

                <span className="text-xs font-medium text-ui-fg-muted w-5 text-center">
                  #{idx + 1}
                </span>

                <Input
                  size="small"
                  value={item}
                  onChange={(e) => handleUpdate(idx, e.target.value)}
                  placeholder="Announcement text..."
                  className="flex-1 bg-white text-xs"
                />

                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors shrink-0 cursor-pointer"
                  title="Remove announcement"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add New Row */}
            <div className="pt-2 flex items-center gap-2">
              <Input
                size="small"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAdd()
                  }
                }}
                placeholder="Type a new offer or announcement..."
                className="flex-1 bg-white text-xs"
              />
              <Button size="small" variant="secondary" onClick={() => handleAdd()}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="pt-4 border-t border-ui-border-base">
          <Text className="text-[11px] font-semibold text-ui-fg-subtle uppercase tracking-wider mb-2 block">
            Quick Templates:
          </Text>
          <div className="flex flex-wrap gap-2">
            {[
              "Free Delivery Eligible On Orders Above ₹{threshold}",
              "Rakhi offer: 5% off on all products on purchase of Rs 999, Use Code RAKHI5",
              "Glow this Rakhi: 5% Off on Magic Pedi. Use Code RAKHI5",
              "Special Launch Offer: Get 10% Off On First Order | Code: WELCOME10",
              "European Quality Shoe Care — Crafted For Performance",
            ].map((tmpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAdd(tmpl)}
                className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 px-2.5 py-1 rounded-md border border-gray-200 transition-colors cursor-pointer text-left"
              >
                + {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-ui-border-base">
          <Button variant="secondary" size="small" onClick={fetchAnnouncements}>
            <ArrowPath className="w-3.5 h-3.5 mr-1" /> Reload
          </Button>

          <Button
            variant="secondary"
            size="small"
            isLoading={saving}
            onClick={handleSave}
            className="bg-gray-900 text-white hover:bg-black border-transparent font-medium px-5"
          >
            Save & Publish Changes
          </Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Announcements",
  icon: Sparkles,
})

export default AnnouncementsPage
