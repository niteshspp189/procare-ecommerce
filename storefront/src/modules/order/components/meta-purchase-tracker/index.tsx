"use client"

import { useEffect } from "react"
import { trackMetaEvent } from "@lib/util/meta-pixel"

export default function MetaPurchaseTracker({
  total,
  currencyCode = "INR",
}: {
  total?: number | null
  currencyCode?: string
}) {
  useEffect(() => {
    trackMetaEvent("Purchase", {
      value: total || 0,
      currency: (currencyCode || "INR").toUpperCase(),
    })
  }, [total, currencyCode])

  return null
}
