"use client"

import { useEffect } from "react"
import { trackMetaEvent } from "@lib/util/meta-pixel"

export default function MetaCheckoutTracker({
  total,
  currencyCode = "INR",
}: {
  total?: number | null
  currencyCode?: string
}) {
  useEffect(() => {
    trackMetaEvent("InitiateCheckout", {
      value: total || 0,
      currency: (currencyCode || "INR").toUpperCase(),
    })
  }, [total, currencyCode])

  return null
}
