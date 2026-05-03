import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

const OrderStatsWidget = () => {
  const stats = [
    { label: 'Total Orders', value: '128', change: '↑ 12%', trend: 'positive' },
    { label: 'Net Revenue', value: '₹45,200', change: '↑ 8%', trend: 'positive' },
    { label: 'Avg. Order', value: '₹353', change: 'Stable', trend: 'neutral' },
    { label: 'Active Customers', value: '842', change: '↑ 24 today', trend: 'positive' }
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
