import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Text } from "@medusajs/ui"
import { CircleStack } from "@medusajs/icons"
import { useState } from "react"

const BackupPage = () => {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    // Redirect browser to download the backup file directly
    window.location.href = "/admin/backup"
    setTimeout(() => {
      setDownloading(false)
    }, 3000)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="py-8 max-w-xl">
        <div className="flex flex-col items-center text-center p-8 gap-y-6">
          <div className="w-16 h-16 rounded-full bg-[#f0faf9] border border-[#00b5a4]/30 flex items-center justify-center text-[#00b5a4] shadow-sm">
            <CircleStack className="w-8 h-8" />
          </div>

          <div className="flex flex-col gap-y-2">
            <Heading level="h1">Database Backup</Heading>
            <Text className="text-ui-fg-subtle text-sm">
              Export a full PostgreSQL database dump in compressed SQL.gz format.
              This backup saves the entire current state of your catalog, orders, and configuration.
            </Text>
          </div>

          <Button 
            variant="primary" 
            size="large" 
            onClick={handleDownload}
            isLoading={downloading}
            className="!bg-[#00b5a4] !border-[#00b5a4] hover:!bg-[#009d8e] px-8 py-3 rounded-full text-sm font-bold shadow-md"
          >
            Export Full Backup (.sql.gz)
          </Button>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "DB Backup",
  icon: CircleStack,
  nested: "/settings",
})

export default BackupPage
