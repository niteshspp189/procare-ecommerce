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

// ⚠️ DISABLED: Quick Management has been merged into product-intelligence.tsx
// and now renders above the Meta Information panel.
// This widget returns null to prevent double-rendering.
export const config = defineWidgetConfig({
  zone: "product.details.before", // moved to non-visible zone
})

const QuickEditVariantWidget = () => {
  return null
}

export default QuickEditVariantWidget
