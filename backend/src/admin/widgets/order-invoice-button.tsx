import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { DocumentText, ArchiveBox, ArrowUturnLeft } from "@medusajs/icons"
import { useState } from "react"

const OrderInvoiceWidget = ({ data }: { data: any }) => {
  const [archiving, setArchiving] = useState(false)
  const isArchived = data.metadata?.is_archived === true || data.metadata?.is_archived === "true"

  const handleDownload = () => {
    window.open(`/admin/orders/${data.id}/invoice`, "_blank")
  }

  const handleToggleArchive = async () => {
    try {
      setArchiving(true)
      const res = await fetch("/admin/custom/orders/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ order_id: data.id, is_archived: !isArchived }),
      })
      const resData = await res.json()
      if (res.ok && resData.success) {
        toast.success(isArchived ? "Order restored to All Orders!" : "Order moved to Archived Orders!")
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        toast.error(resData.message || "Failed to update archive status")
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating archive status")
    } finally {
      setArchiving(false)
    }
  }

  return (
    <Container className="p-6 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div>
        <Heading level="h2" className="text-base font-semibold mb-0.5">Order Actions & Invoice</Heading>
        <Text className="text-gray-500 text-xs">
          {isArchived ? (
            <span className="text-amber-600 font-medium">This order is currently archived.</span>
          ) : (
            `Download official tax invoice or archive this order.`
          )}
        </Text>
      </div>
      <div className="flex items-center gap-2 mt-2 sm:mt-0">
        <Button
          variant="secondary"
          size="small"
          isLoading={archiving}
          onClick={handleToggleArchive}
          className="flex items-center gap-x-1.5"
        >
          {isArchived ? (
            <>
              <ArrowUturnLeft className="w-3.5 h-3.5 text-emerald-600" />
              Unarchive Order
            </>
          ) : (
            <>
              <ArchiveBox className="w-3.5 h-3.5 text-ui-fg-subtle" />
              Archive Order
            </>
          )}
        </Button>

        <Button variant="secondary" size="small" onClick={handleDownload} className="flex items-center gap-x-1.5">
          <DocumentText className="w-3.5 h-3.5" />
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
