import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import { Container, Heading, Table, Text, Badge, Button, toast, Drawer } from "@medusajs/ui"
import { useEffect, useState } from "react"

const RazorpayTransactionsPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [previewPayment, setPreviewPayment] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all") // 'all', 'missing', 'created'
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("real")

  useEffect(() => {
    fetch("/admin/razorpay/transactions")
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleSync = async (cartId: string) => {
    setSyncing(cartId)
    try {
      const res = await fetch("/admin/razorpay/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Order Synchronized", {
          description: "The order has been created successfully."
        })
        // refresh data
        const refreshRes = await fetch("/admin/razorpay/transactions")
        const refreshData = await refreshRes.json()
        setPayments(refreshData.payments || [])
      } else {
        toast.error("Sync Failed", {
          description: data.message || "Failed to sync order"
        })
      }
    } catch (err) {
      console.error(err)
      toast.error("Error", {
        description: "An error occurred while syncing"
      })
    } finally {
      setSyncing(null)
    }
  }

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1">Razorpay Transactions</Heading>
          <Text className="text-ui-fg-subtle mt-1">View recent Razorpay payments and identify missing Medusa orders.</Text>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => setActiveTab("all")} 
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === "all" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-sm border" : "text-ui-fg-subtle hover:bg-ui-bg-base-hover"}`}
        >
          All Transactions
        </button>
        <button 
          onClick={() => setActiveTab("missing")} 
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === "missing" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-sm border" : "text-ui-fg-subtle hover:bg-ui-bg-base-hover"}`}
        >
          Missing Orders
        </button>
        <button 
          onClick={() => setActiveTab("created")} 
          className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === "created" ? "bg-ui-bg-base-pressed text-ui-fg-base shadow-sm border" : "text-ui-fg-subtle hover:bg-ui-bg-base-hover"}`}
        >
          Incomplete / Created
        </button>

        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center">
            <Text className="text-sm text-ui-fg-subtle mr-2">Status:</Text>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border rounded-md px-2 py-1 bg-white"
            >
              <option value="all">All</option>
              <option value="real">Real Payments</option>
              <option value="captured">Captured</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="pl-4 border-l flex items-center">
            <Text className="text-sm text-ui-fg-subtle mr-2">Month:</Text>
          <select 
            value={monthFilter} 
            onChange={(e) => setMonthFilter(e.target.value)}
            className="text-sm border rounded-md px-2 py-1 bg-white"
          >
            <option value="all">All (Since Apr 2026)</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-04">April 2026</option>
          </select>
        </div>
        </div>
      </div>

      {loading ? (
        <Text>Loading transactions...</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Table.HeaderCell>Payment ID</Table.HeaderCell>
              <Table.HeaderCell>Razorpay Order</Table.HeaderCell>
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Table.HeaderCell>Method</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Medusa Order</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payments.filter((p: any) => {
              if (activeTab === "missing") return p.status === "captured" && !p.medusa_order_display_id;
              if (activeTab === "created") return p.status === "created" || p.status === "attempted";
              
              if (activeTab === "all") {
                if (statusFilter === "real") return p.status !== "created" && p.status !== "attempted";
                if (statusFilter === "captured") return p.status === "captured" || p.status === "paid";
                if (statusFilter === "failed") return p.status === "failed";
              }
              return true;
            }).filter((p: any) => {
              if (monthFilter === "all") return true;
              const d = new Date(p.created_at * 1000);
              const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              return m === monthFilter;
            }).map((p: any) => (
              <Table.Row key={p.id}>
                <Table.Cell>{new Date(p.created_at * 1000).toLocaleString()}</Table.Cell>
                <Table.Cell>{p.id}</Table.Cell>
                <Table.Cell>{p.type === 'order' ? p.id : (p.order_id || "-")}</Table.Cell>
                <Table.Cell>₹{(p.amount / 100).toFixed(2)}</Table.Cell>
                <Table.Cell>{p.method || <Text className="text-ui-fg-subtle">N/A</Text>}</Table.Cell>
                <Table.Cell>
                  <Badge color={p.status === "captured" || p.status === "paid" ? "green" : (p.status === "failed" ? "red" : "orange")}>
                    {p.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {p.medusa_order_display_id ? (
                    <a href={`/a/orders/${p.medusa_order_uuid}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      <Badge color="green">{p.medusa_order_display_id}</Badge>
                    </a>
                  ) : p.status === "captured" ? (
                    <div className="flex items-center space-x-2">
                      <Badge color="red">Missing Order</Badge>
                        {p.medusa_cart?.id && (
                           <Button 
                             size="small" 
                             variant="secondary"
                             isLoading={syncing === p.medusa_cart.id}
                             onClick={() => setPreviewPayment(p)}
                           >
                             Sync / Create
                           </Button>
                        )}
                    </div>
                  ) : (
                    <Text className="text-ui-fg-subtle">-</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {previewPayment && (
        <Drawer open={!!previewPayment} onOpenChange={(open) => !open && setPreviewPayment(null)}>
          <Drawer.Content className="right-2 inset-y-2 rounded-lg max-w-[500px] w-full">
            <Drawer.Header>
              <Drawer.Title>Order Sync Preview</Drawer.Title>
              <Drawer.Description>Review cart details before creating the order.</Drawer.Description>
            </Drawer.Header>
            <Drawer.Body className="p-4 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <Heading level="h3" className="mb-2">Payment Details</Heading>
                  <Text size="small" className="text-ui-fg-subtle">Payment ID: {previewPayment.id}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Amount Paid: ₹{(previewPayment.amount / 100).toFixed(2)}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Method: {previewPayment.method}</Text>
                </div>
                
                {previewPayment.medusa_cart && (
                  <>
                    <div className="border-t border-ui-border-base pt-4">
                      <Heading level="h3" className="mb-2">Customer Info</Heading>
                      <Text size="small" className="text-ui-fg-subtle">Email: {previewPayment.medusa_cart.email}</Text>
                      {previewPayment.medusa_cart.shipping_address && (
                        <div className="mt-2 text-sm text-ui-fg-subtle">
                          <strong>Shipping Address:</strong><br />
                          {previewPayment.medusa_cart.shipping_address.first_name} {previewPayment.medusa_cart.shipping_address.last_name}<br />
                          {previewPayment.medusa_cart.shipping_address.address_1}, {previewPayment.medusa_cart.shipping_address.city}<br />
                          {previewPayment.medusa_cart.shipping_address.postal_code}<br />
                          Phone: {previewPayment.medusa_cart.shipping_address.phone}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-ui-border-base pt-4">
                      <Heading level="h3" className="mb-2">Cart Items ({previewPayment.medusa_cart.items?.length || 0})</Heading>
                      <div className="space-y-2">
                        {previewPayment.medusa_cart.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center bg-ui-bg-base-hover p-2 rounded-md">
                            <div className="flex-1 pr-2">
                              <Text size="small" className="font-medium line-clamp-1" title={item.title}>
                                {item.title} {item.variant?.title ? `(${item.variant.title})` : ''}
                              </Text>
                              <Text size="small" className="text-ui-fg-subtle">Qty: {item.quantity}</Text>
                            </div>
                            <Text size="small" className="font-medium">
                              ₹{(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-ui-border-base pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <Text size="small" className="text-ui-fg-subtle">Subtotal</Text>
                        <Text size="small">₹{previewPayment.medusa_cart.items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * Number(item.quantity)), 0).toFixed(2)}</Text>
                      </div>
                      {Number(previewPayment.medusa_cart.discount_total) > 0 && (
                        <div className="flex justify-between items-center">
                          <Text size="small" className="text-ui-fg-subtle">Discount</Text>
                          <Text size="small" className="text-ui-tag-red-text">-₹{Number(previewPayment.medusa_cart.discount_total).toFixed(2)}</Text>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <Text size="small" className="text-ui-fg-subtle">Shipping</Text>
                        <Text size="small">₹{Number(previewPayment.medusa_cart.shipping_total || 0).toFixed(2)}</Text>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-ui-border-base mt-2">
                        <div>
                          <Heading level="h3">Cart Total</Heading>
                          {Number(previewPayment.medusa_cart.tax_total) > 0 && (
                            <Text size="small" className="text-ui-fg-subtle">Includes ₹{Number(previewPayment.medusa_cart.tax_total).toFixed(2)} Tax</Text>
                          )}
                        </div>
                        <Text className="font-bold text-ui-fg-base">
                          ₹{Number(previewPayment.medusa_cart.total || 0).toFixed(2)}
                        </Text>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Drawer.Body>
            <Drawer.Footer className="flex justify-end space-x-2 p-4 border-t border-ui-border-base">
              <Drawer.Close asChild>
                <Button variant="secondary" onClick={() => setPreviewPayment(null)}>Cancel</Button>
              </Drawer.Close>
              <Button 
                variant="primary" 
                isLoading={syncing === previewPayment.medusa_cart?.id}
                onClick={() => {
                  handleSync(previewPayment.medusa_cart?.id)
                  setPreviewPayment(null)
                }}
              >
                Confirm & Sync
              </Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      )}

    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Transaction log",
  icon: CreditCard,
})

export default RazorpayTransactionsPage
