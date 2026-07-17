import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Button, 
  Container, 
  Heading, 
  Input, 
  Table, 
  Text,
  Badge,
  toast
} from "@medusajs/ui"
import { useEffect, useState } from "react"

// ⚠️ DISABLED: Quick Management has been merged into product-intelligence.tsx
// and now renders above the Meta Information panel.
// This widget returns null to prevent double-rendering.
export const config = defineWidgetConfig({
  zone: "product.details.before", // moved to non-visible zone
})

const QuickEditVariantWidget = ({ data }: any) => {
  const [variants, setVariants] = useState<any[]>([])
  // Map of variantId -> { id: priceId, amount: number } for selling prices
  const [sellPriceMap, setSellPriceMap] = useState<Record<string, { id: string; amount: number } | null>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      // 1. Fetch product variants (for MRP / default INR price)
      const productRes = await fetch(
        `/admin/products/${data.id}?fields=*variants,*variants.prices`,
        { credentials: "include" }
      )
      const productData = await productRes.json()
      const fetchedVariants: any[] = productData.product?.variants || []
      setVariants(fetchedVariants)

      // 2. Fetch selling prices from pl_online_sale price list separately
      //    The API returns: { prices: [{ id, amount, currency_code, price_set: { variant: { id } } }] }
      const spRes = await fetch(
        `/admin/price-lists/pl_online_sale/prices?limit=500&fields=id,amount,currency_code,price_set.variant.id`,
        { credentials: "include" }
      )
      const spData = await spRes.json()
      const spPrices: any[] = spData.prices || []

      // Build a map: variantId -> { id, amount }
      const map: Record<string, { id: string; amount: number } | null> = {}
      // Initialize all variants as null (no SP yet)
      for (const v of fetchedVariants) {
        map[v.id] = null
      }
      for (const sp of spPrices) {
        if (sp.currency_code !== "inr") continue
        const variantId = sp.price_set?.variant?.id
        if (variantId && map.hasOwnProperty(variantId)) {
          map[variantId] = { id: sp.id, amount: sp.amount }
        }
      }
      setSellPriceMap(map)
    } catch (error) {
      console.error("Error fetching product data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [data.id])

  const handleUpdatePrice = async (variantId: string, priceAmount: number) => {
    setUpdating(variantId)
    try {
      const variant = variants.find(v => v.id === variantId)
      const inrPrice = variant?.prices?.find((p: any) => p.currency_code === "inr")
      
      if (!inrPrice) {
        toast.error("INR price not found for this variant.")
        return
      }

      const response = await fetch(`/admin/products/${data.id}/variants/${variantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prices: [{ id: inrPrice.id, amount: priceAmount, currency_code: "inr" }]
        }),
        credentials: "include",
      })

      if (response.ok) {
        toast.success("MRP updated successfully")
        fetchData()
      } else {
        toast.error("Failed to update MRP")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("An error occurred while updating")
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateSellingPrice = async (variantId: string, priceAmount: number) => {
    setUpdating(variantId)
    try {
      const existing = sellPriceMap[variantId]
      let body: any = {}

      if (existing) {
        // Update existing SP price entry
        body = { update: [{ id: existing.id, amount: priceAmount }] }
      } else {
        // Create new SP price entry — requires variant_id so Medusa can link price_set
        body = {
          create: [{
            variant_id: variantId,
            amount: priceAmount,
            currency_code: "inr"
          }]
        }
      }

      const response = await fetch(`/admin/price-lists/pl_online_sale/prices/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Selling price updated successfully")
        fetchData()
      } else {
        const errBody = await response.text()
        console.error("SP update failed:", errBody)
        toast.error("Failed to update selling price")
      }
    } catch (error) {
      console.error("Update selling price error:", error)
      toast.error("An error occurred while updating selling price")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <Container><Text>Loading Quick Actions...</Text></Container>

  return (
    <Container className="mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h2">Quick Management</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Update prices and monitor stock without opening menus.
          </Text>
        </div>
        <Badge color="green">Premium Flow</Badge>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Variant</Table.HeaderCell>
            <Table.HeaderCell>SKU</Table.HeaderCell>
            <Table.HeaderCell>Inventory</Table.HeaderCell>
            <Table.HeaderCell>MRP (INR)</Table.HeaderCell>
            <Table.HeaderCell>Selling Price (INR)</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {variants.map((variant) => {
            const mrpPrice = variant.prices?.find((p: any) => p.currency_code === "inr")?.amount || 0
            const spEntry = sellPriceMap[variant.id]
            const sellingPrice = spEntry?.amount ?? 0

            return (
              <Table.Row key={variant.id}>
                <Table.Cell>
                  <Text size="small" weight="plus">{variant.title}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small" className="text-ui-fg-subtle">{variant.sku || "-"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge color={variant.inventory_quantity > 0 ? "blue" : "red"}>
                    {variant.inventory_quantity > 0 ? "in stock" : "out of stock"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-x-2">
                    <span className="text-ui-fg-muted">₹</span>
                    <Input 
                      type="number" 
                      defaultValue={mrpPrice} 
                      className="w-24 h-8"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (val !== mrpPrice) {
                          handleUpdatePrice(variant.id, val)
                        }
                      }}
                    />
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-x-2">
                    <span className="text-ui-fg-muted">₹</span>
                    <Input 
                      key={`sp-${variant.id}-${sellingPrice}`}
                      type="number" 
                      defaultValue={sellingPrice || undefined}
                      placeholder="Add SP"
                      className="w-24 h-8"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val !== sellingPrice) {
                          handleUpdateSellingPrice(variant.id, val)
                        }
                      }}
                    />
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button 
                    variant="secondary" 
                    size="small"
                    isLoading={updating === variant.id}
                    onClick={() => {
                      window.location.href = `/store-backend/products/${data.id}/variants/${variant.id}`
                    }}
                  >
                    Manage
                  </Button>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table>
    </Container>
  )
}

export default QuickEditVariantWidget
