import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyRupee } from "@medusajs/icons"
import { Container, Heading, Table, Badge, Button, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

const RazorpayTransactionsPage = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <Container className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading level="h1">Razorpay Transactions</Heading>
          <Text className="text-ui-fg-subtle mt-1">View recent Razorpay payments and identify missing Medusa orders.</Text>
        </div>
        <Button variant="secondary" onClick={() => window.location.reload()}>Refresh</Button>
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
            {payments.map((p: any) => (
              <Table.Row key={p.id}>
                <Table.Cell>{new Date(p.created_at * 1000).toLocaleString()}</Table.Cell>
                <Table.Cell>{p.id}</Table.Cell>
                <Table.Cell>{p.order_id}</Table.Cell>
                <Table.Cell>₹{(p.amount / 100).toFixed(2)}</Table.Cell>
                <Table.Cell>{p.method}</Table.Cell>
                <Table.Cell>
                  <Badge color={p.status === "captured" ? "green" : (p.status === "failed" ? "red" : "orange")}>
                    {p.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {p.medusa_order_id ? (
                    <Badge color="green">{p.medusa_order_id}</Badge>
                  ) : (
                    p.status === "captured" ? <Badge color="red">Missing Order</Badge> : <Text className="text-ui-fg-subtle">-</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Razorpay Sync",
  icon: CurrencyRupee,
})

export default RazorpayTransactionsPage
