import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { ArrowDownTray, UserGroup } from "@medusajs/icons"
import { useState } from "react"
import { exportToCSV } from "../utils/csv-export"

const CustomerExportWidget = () => {
  const [exporting, setExporting] = useState(false)

  const handleExportCustomers = async () => {
    try {
      setExporting(true)
      const res = await fetch("/admin/custom/customers/export", {
        credentials: "include",
      })
      const data = await res.json()

      if (!res.ok || !data.success || !data.customers || data.customers.length === 0) {
        toast.error(data.message || "No customers found to export")
        return
      }

      const headers = [
        "Customer ID",
        "Customer Name",
        "Email",
        "Phone",
        "Address",
        "City",
        "State",
        "Pincode",
        "Country",
        "Total Orders",
        "Total Spent (INR)",
        "Joined Date",
      ]

      const rows = data.customers.map((c: any) => [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address_1,
        c.city,
        c.province,
        c.postal_code,
        c.country_code?.toUpperCase() || "IN",
        c.order_count || 0,
        Number(c.total_spent || 0).toFixed(2),
        c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "-",
      ])

      const filename = `ProCare_Customers_${new Date().toISOString().slice(0, 10)}.csv`
      exportToCSV(filename, headers, rows)
      toast.success(`Exported ${data.customers.length} customers to CSV successfully!`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to export customers")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Container className="p-4 mb-4 flex items-center justify-between bg-ui-bg-base border border-ui-border-base rounded-lg shadow-2xs">
      <div className="flex items-center gap-3">
        <UserGroup className="w-5 h-5 text-ui-fg-muted" />
        <div>
          <Heading level="h2" className="text-sm font-semibold">
            Customer Directory
          </Heading>
          <Text className="text-ui-fg-muted text-xs">
            Export all registered and guest customers with full contact and lifetime order statistics.
          </Text>
        </div>
      </div>

      <Button
        variant="secondary"
        size="small"
        isLoading={exporting}
        onClick={handleExportCustomers}
        className="flex items-center gap-1.5"
      >
        <ArrowDownTray className="w-3.5 h-3.5" />
        Export Customers (CSV)
      </Button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "customer.list.before",
})

export default CustomerExportWidget
