import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Text,
  Button,
  Table,
  Badge,
  Input,
  Label,
  toast,
} from "@medusajs/ui"
import {
  Tag,
  Plus,
  ArrowPath,
  PencilSquare,
  Trash,
  Check,
  XMark,
} from "@medusajs/icons"
import { useState, useEffect } from "react"

interface Coupon {
  id: string
  code: string
  status: "active" | "inactive"
  discount_type: "percentage" | "fixed"
  discount_value: number
  allocation: string
  min_order_value: number
  raw_threshold: number
  limit: number | null
  used: number
  campaign_id: string | null
  campaign_name: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  // Form State
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<string>("5")
  const [minOrderValue, setMinOrderValue] = useState<string>("999")
  const [limit, setLimit] = useState<string>("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [startsAt, setStartsAt] = useState<string>("")
  const [endsAt, setEndsAt] = useState<string>("")

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await fetch("/admin/custom/coupons", { credentials: "include" })
      const data = await res.json()
      if (data && data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons)
      } else {
        toast.error(data.message || "Failed to load coupons")
      }
    } catch (err: any) {
      console.error("Failed to fetch coupons:", err)
      toast.error(err.message || "Failed to fetch coupons")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const openCreateModal = () => {
    setEditingCoupon(null)
    setCode("")
    setDiscountType("percentage")
    setDiscountValue("5")
    setMinOrderValue("999")
    setLimit("")
    setStatus("active")
    setStartsAt("")
    setEndsAt("")
    setModalOpen(true)
  }

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setCode(coupon.code)
    setDiscountType(coupon.discount_type)
    setDiscountValue(coupon.discount_value.toString())
    setMinOrderValue(coupon.min_order_value ? coupon.min_order_value.toString() : "")
    setLimit(coupon.limit ? coupon.limit.toString() : "")
    setStatus(coupon.status)
    setStartsAt(coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : "")
    setEndsAt(coupon.ends_at ? new Date(coupon.ends_at).toISOString().slice(0, 16) : "")
    setModalOpen(true)
  }

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === "active" ? "inactive" : "active"
    try {
      const res = await fetch("/admin/custom/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          min_order_value: coupon.min_order_value,
          limit: coupon.limit,
          status: newStatus,
          starts_at: coupon.starts_at,
          ends_at: coupon.ends_at,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Coupon ${coupon.code} is now ${newStatus}`)
        fetchCoupons()
      } else {
        toast.error(data.message || "Failed to update status")
      }
    } catch (err: any) {
      toast.error(err.message || "Error toggling status")
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon '${coupon.code}'?`)) {
      return
    }

    try {
      const res = await fetch(`/admin/custom/coupons?id=${coupon.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Coupon ${coupon.code} deleted successfully`)
        fetchCoupons()
      } else {
        toast.error(data.message || "Failed to delete coupon")
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting coupon")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      toast.error("Please enter a coupon code")
      return
    }
    const val = Number(discountValue)
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid discount value")
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        id: editingCoupon?.id,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: val,
        min_order_value: minOrderValue ? Number(minOrderValue) : 0,
        limit: limit ? Number(limit) : null,
        status,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      }

      const res = await fetch("/admin/custom/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || "Coupon saved successfully")
        setModalOpen(false)
        fetchCoupons()
      } else {
        toast.error(data.message || "Failed to save coupon")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  const activeCount = coupons.filter((c) => c.status === "active").length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.used || 0), 0)

  return (
    <div className="w-full flex flex-col gap-y-6">
      {/* ── Top Header ── */}
      <Container className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Heading level="h1" className="text-lg font-semibold text-ui-fg-base flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-700" /> Coupons & Promotions Manager
          </Heading>
          <Text className="text-ui-fg-subtle text-xs mt-0.5">
            Create and manage promo codes with minimum cart thresholds, discount rates, and validity dates.
          </Text>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="small" onClick={fetchCoupons} disabled={loading}>
            <ArrowPath className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Reload
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={openCreateModal}
            className="bg-gray-900 text-white hover:bg-black border-transparent font-medium px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> + Create Coupon
          </Button>
        </div>
      </Container>

      {/* ── Metric Summary Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Container className="p-4 flex items-center justify-between">
          <div>
            <Text className="text-[11px] font-semibold text-ui-fg-subtle uppercase tracking-wider">
              Active Coupons
            </Text>
            <Heading level="h2" className="text-xl font-bold text-green-700 mt-1">
              {activeCount}
            </Heading>
          </div>
          <Badge color="green" size="small">Live</Badge>
        </Container>

        <Container className="p-4 flex items-center justify-between">
          <div>
            <Text className="text-[11px] font-semibold text-ui-fg-subtle uppercase tracking-wider">
              Total Configured
            </Text>
            <Heading level="h2" className="text-xl font-bold text-gray-900 mt-1">
              {coupons.length}
            </Heading>
          </div>
          <Badge color="grey" size="small">All Time</Badge>
        </Container>

        <Container className="p-4 flex items-center justify-between">
          <div>
            <Text className="text-[11px] font-semibold text-ui-fg-subtle uppercase tracking-wider">
              Total Redemptions
            </Text>
            <Heading level="h2" className="text-xl font-bold text-blue-700 mt-1">
              {totalRedemptions}
            </Heading>
          </div>
          <Badge color="blue" size="small">Orders</Badge>
        </Container>
      </div>

      {/* ── Coupons Data Table ── */}
      <Container className="p-0 overflow-hidden">
        <div className="p-4 border-b border-ui-border-base flex items-center justify-between">
          <Heading level="h2" className="text-xs font-semibold text-ui-fg-base uppercase tracking-wider">
            All Promotional Coupons ({coupons.length})
          </Heading>
        </div>

        {loading ? (
          <div className="py-12 text-center text-ui-fg-subtle text-xs">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="py-12 text-center text-ui-fg-subtle text-xs">
            No coupons found. Click <strong>+ Create Coupon</strong> to add your first promotion.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell className="text-xs">Coupon Code</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs">Discount</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs">Min Spend (Cart)</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs">Validity / Dates</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs">Usage</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs">Status</Table.HeaderCell>
                  <Table.HeaderCell className="text-xs text-right">Actions</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {coupons.map((coupon) => (
                  <Table.Row key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    {/* Code */}
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-gray-100 text-gray-900 px-2 py-1 rounded border border-gray-300">
                          {coupon.code}
                        </span>
                      </div>
                    </Table.Cell>

                    {/* Discount */}
                    <Table.Cell>
                      <span className="font-semibold text-xs text-gray-900">
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      </span>
                    </Table.Cell>

                    {/* Min Spend */}
                    <Table.Cell>
                      {coupon.min_order_value > 0 ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ≥ ₹{coupon.min_order_value}
                        </span>
                      ) : (
                        <span className="text-xs text-ui-fg-muted">No Minimum</span>
                      )}
                    </Table.Cell>

                    {/* Dates */}
                    <Table.Cell>
                      <div className="text-[11px] text-ui-fg-subtle">
                        {coupon.starts_at || coupon.ends_at ? (
                          <div className="flex flex-col">
                            {coupon.starts_at && (
                              <span>From: {new Date(coupon.starts_at).toLocaleDateString("en-IN")}</span>
                            )}
                            {coupon.ends_at && (
                              <span>Until: {new Date(coupon.ends_at).toLocaleDateString("en-IN")}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Always Active (No Expiry)</span>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Usage */}
                    <Table.Cell>
                      <span className="text-xs text-ui-fg-base">
                        {coupon.used} {coupon.limit ? `/ ${coupon.limit}` : "used"}
                      </span>
                    </Table.Cell>

                    {/* Status */}
                    <Table.Cell>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon)}
                        className="cursor-pointer"
                        title="Click to toggle active/inactive"
                      >
                        <Badge color={coupon.status === "active" ? "green" : "grey"} size="small">
                          {coupon.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(coupon)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Edit coupon"
                        >
                          <PencilSquare className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                          title="Delete coupon"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Container>

      {/* ── Create / Edit Coupon Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <Heading level="h2" className="text-sm font-semibold text-gray-900">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
              </Heading>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
              >
                <XMark className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Coupon Code */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Coupon Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  size="small"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="e.g. RAKHI5, WELCOME10"
                  className="font-mono uppercase font-bold text-xs"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  The exact code customers will type at checkout.
                </span>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Discount Type
                  </Label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-black"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Discount Value <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    size="small"
                    type="number"
                    min="1"
                    step="any"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "percentage" ? "e.g. 5 for 5%" : "e.g. 100 for ₹100"}
                    className="text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Min Order Value (₹) */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Minimum Cart Order Spend (₹)
                </Label>
                <Input
                  size="small"
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="e.g. 999 (Leave blank or 0 for no minimum)"
                  className="text-xs"
                />
                <span className="text-[10px] text-emerald-600 mt-0.5 block">
                  💡 Automatically handles pre-tax GST calculation for accurate storefront threshold validation.
                </span>
              </div>

              {/* Max Usage Limit */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Total Redemption Limit (Optional)
                </Label>
                <Input
                  size="small"
                  type="number"
                  min="1"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="e.g. 500 orders (Leave blank for unlimited)"
                  className="text-xs"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Start Date & Time (Optional)
                  </Label>
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-xs font-sans focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Expiry Date & Time (Optional)
                  </Label>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-xs font-sans focus:outline-hidden focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Initial Status
                </Label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full h-8 px-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-black"
                >
                  <option value="active">Active (Available for customers)</option>
                  <option value="inactive">Inactive (Disabled)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  size="small"
                  isLoading={saving}
                  className="bg-gray-900 text-white hover:bg-black border-transparent font-medium px-4"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  {editingCoupon ? "Save Changes" : "Create Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Coupons & Discounts",
  icon: Tag,
})

export default CouponsPage
