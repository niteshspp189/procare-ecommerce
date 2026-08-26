import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"

const OrderInvoiceWidget = ({ data }: { data: any }) => {
  const handleDownload = () => {
    window.open(`/admin/orders/${data.id}/invoice`, "_blank")
  }

  return (
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div>
        <Heading level="h2" className="text-base font-semibold mb-0.5">Order Tax Invoice</Heading>
        <Text className="text-gray-500 text-xs">Download the official tax invoice PDF for order #{data.display_id || data.id}</Text>
      </div>
      <div className="mt-2 sm:mt-0">
        <Button variant="secondary" size="small" onClick={handleDownload} className="flex items-center gap-x-2">
          <DocumentText className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default OrderInvoiceWidget
