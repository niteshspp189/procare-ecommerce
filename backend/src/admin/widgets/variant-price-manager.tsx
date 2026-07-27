import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, Input, Button, toast } from "@medusajs/ui"
import { useState, useEffect } from "react"

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.before",
})

export default function VariantPriceManagerWidget({ data: variant }: { data: any }) {
  const [mrp, setMrp] = useState<string>("")
  const [sellingPrice, setSellingPrice] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const variantId = variant?.id
  const productId = variant?.product_id

  const fetchVariantPrices = async () => {
    if (!variantId) return
    try {
      setLoading(true)
      const res = await fetch(`/admin/products/${productId}?fields=*variants,*variants.prices`, { credentials: "include" })
      const data = await res.json()
      const p = data?.product
      const v = (p?.variants || []).find((vItem: any) => vItem.id === variantId)
      if (!v) return

      const meta = v.metadata || {}
      
      // Determine MRP
      let curMrp = meta.mrp
      if (curMrp === undefined || curMrp === null) {
        const inrPrice = (v.prices || []).find((price: any) => price.currency_code === "inr" && !price.price_list_id)
        if (inrPrice) curMrp = inrPrice.amount
      }

      // Determine Selling Price (SP)
      let curSp = meta.sellingPrice
      if (curSp === undefined || curSp === null) {
        const salePrice = (v.prices || []).find((price: any) => price.currency_code === "inr" && price.price_list_id === "pl_online_sale")
        if (salePrice) {
          curSp = salePrice.amount
        } else {
          curSp = curMrp
        }
      }

      setMrp(curMrp !== undefined && curMrp !== null ? String(curMrp) : "")
      setSellingPrice(curSp !== undefined && curSp !== null ? String(curSp) : "")
    } catch (e: any) {
      console.error("Error fetching variant prices:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVariantPrices()
  }, [variantId])

  const handleSavePrices = async () => {
    setSaving(true)
    try {
      const mrpNum = parseFloat(mrp)
      const spNum = parseFloat(sellingPrice)

      if (isNaN(mrpNum) || isNaN(spNum)) {
        toast.error("Please enter valid numbers for MRP and Selling Price")
        return
      }

      const res = await fetch(`/admin/quick-price-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          variant_id: variantId,
          mrp: mrpNum,
          selling_price: spNum
        })
      })

      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success("Variant SP & MRP updated successfully!")
        fetchVariantPrices()
      } else {
        toast.error(resData.message || "Failed to update prices")
      }
    } catch (err: any) {
      toast.error("Error saving variant prices")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="p-4 mb-4 bg-white rounded-xl border border-gray-200 shadow-xs">
      <Heading level="h2" className="text-sm font-bold text-gray-900 mb-1 flex items-center justify-between">
        🏷️ Prices (INR)
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
          SP & MRP
        </span>
      </Heading>
      <Text size="small" className="text-xs text-gray-500 mb-3">
        Manage Selling Price (SP) & MRP directly for Indian Rupee (INR).
      </Text>

      {loading ? (
        <Text size="small" className="text-gray-400 animate-pulse">Loading prices...</Text>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/80 rounded-lg border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">Selling Price (SP)</span>
            <div className="flex items-center gap-1 max-w-[120px]">
              <span className="text-xs font-bold text-gray-500">₹</span>
              <Input
                type="number"
                size="small"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="text-xs font-bold text-teal-700 h-7"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 p-2 bg-gray-50/80 rounded-lg border border-gray-100">
            <span className="text-xs font-semibold text-gray-700">MRP (Original)</span>
            <div className="flex items-center gap-1 max-w-[120px]">
              <span className="text-xs font-bold text-gray-500">₹</span>
              <Input
                type="number"
                size="small"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="text-xs font-bold text-gray-900 h-7"
              />
            </div>
          </div>

          <Button
            size="small"
            variant="primary"
            isLoading={saving}
            onClick={handleSavePrices}
            className="w-full bg-[#00bda5] hover:bg-[#00a38f] text-white font-bold h-8 mt-2"
          >
            Save SP & MRP
          </Button>
        </div>
      )}
    </Container>
  )
}
