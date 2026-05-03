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

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

const QuickEditVariantWidget = ({ data }: any) => {
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const response = await fetch(`/admin/products/${data.id}?fields=*variants,*variants.prices`, {
        credentials: "include",
      })
      const resData = await response.json()
      setProduct(resData.product)
      setVariants(resData.product.variants || [])
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
      // Find the price for INR
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
          prices: [
            {
              id: inrPrice.id,
              amount: priceAmount,
              currency_code: "inr"
            }
          ]
        }),
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Price updated successfully")
        fetchData()
      } else {
        toast.error("Failed to update price")
      }
    } catch (error) {
      console.error("Update error:", error)
      toast.error("An error occurred while updating")
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
            <Table.HeaderCell>Price (INR)</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {variants.map((variant) => {
            const inrPrice = variant.prices?.find((p: any) => p.currency_code === "inr")?.amount || 0
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
                    {variant.inventory_quantity} in stock
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-x-2">
                    <span className="text-ui-fg-muted">₹</span>
                    <Input 
                      type="number" 
                      defaultValue={inrPrice} 
                      className="w-24 h-8"
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value)
                        if (val !== inrPrice) {
                          handleUpdatePrice(variant.id, val)
                        }
                      }}
                    />
                  </div>
                </Table.Cell>
                <Table.Cell className="text-right">
                   <Button 
                    variant="secondary" 
                    size="small"
                    loading={updating === variant.id}
                    onClick={() => {
                      // Navigate to edit variant if needed, but for now we have quick actions
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
