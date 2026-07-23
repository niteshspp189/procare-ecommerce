"use client"

import { useEffect } from "react"
import { trackMetaEvent } from "@lib/util/meta-pixel"

export default function MetaViewContentTracker({
  title,
  id,
  value,
  currencyCode = "INR",
}: {
  title: string
  id: string
  value?: number
  currencyCode?: string
}) {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: title,
      content_ids: [id],
      content_type: "product",
      value: value || 0,
      currency: (currencyCode || "INR").toUpperCase(),
    })
  }, [title, id, value, currencyCode])

  return null
}
