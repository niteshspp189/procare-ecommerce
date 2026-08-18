import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"

const OrderInvoiceWidget = ({ data }: { data: any }) => {
  const handleDownload = () => {
    // Open the new API route which returns the PDF with Content-Disposition: attachment
    window.open(`/admin/orders/${data.id}/invoice`, '_blank')
  }

  return (
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-center justify-between bg-white border border-gray-200 rounded-lg shadow-sm">
      <div>
        <Heading level="h2" className="text-xl font-semibold mb-1">Order Invoice</Heading>
        <Text className="text-gray-500 text-sm">Download the generated PDF invoice for this order</Text>
      </div>
      <div className="mt-4 sm:mt-0">
        <Button variant="secondary" onClick={handleDownload} className="flex items-center gap-x-2">
          <DocumentText />
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
