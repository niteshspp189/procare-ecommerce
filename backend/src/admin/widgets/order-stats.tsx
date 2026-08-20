import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

const OrderStatsWidget = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/admin/orders/stats', {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        if (res.stats) {
          setData(res.stats)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded-xl mb-6"></div>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const avgOrder = data.totalOrders > 0 ? (data.totalRevenue / data.totalOrders) : 0

  const stats = [
    { label: 'Total Orders', value: data.totalOrders.toString(), change: 'All time', trend: 'neutral' },
    { label: 'Completed vs Refund/Ret', value: `${data.completed} / ${data.refundedOrReturned}`, change: 'Status', trend: data.refundedOrReturned > 0 ? 'neutral' : 'positive' },
    { label: 'Pending Fulfillment', value: data.needsShipping.toString(), change: 'Needs Shipping', trend: data.needsShipping > 0 ? 'positive' : 'neutral' },
    { label: 'Net Revenue', value: formatCurrency(data.totalRevenue), change: `Avg: ${formatCurrency(avgOrder)}`, trend: 'positive' }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Container key={stat.label} className="p-4">
          <Text size="xsmall" className="text-ui-fg-subtle uppercase tracking-wider font-semibold">
            {stat.label}
          </Text>
          <div className="flex items-baseline gap-x-2 mt-1">
            <Heading level="h1" className="text-2xl">
              {stat.value}
            </Heading>
            <Text size="xsmall" className={stat.trend === 'positive' ? 'text-green-600 font-bold' : 'text-ui-fg-muted'}>
              {stat.change}
            </Text>
          </div>
        </Container>
      ))}
    </div>
  )
}

export default OrderStatsWidget
