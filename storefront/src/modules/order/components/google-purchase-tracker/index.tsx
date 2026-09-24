"use client"

import { useEffect } from "react"

export type GooglePurchaseItem = {
  item_id: string
  item_name: string
  item_variant?: string
  price?: number
  quantity: number
}

export default function GooglePurchaseTracker({
  transactionId,
  value,
  currency = "INR",
  items = [],
}: {
  transactionId: string
  value: number | null | undefined
  currency?: string
  items?: GooglePurchaseItem[]
}) {
  useEffect(() => {
    if (typeof window !== "undefined" && transactionId && value !== undefined && value !== null) {
      // @ts-ignore
      window.dataLayer = window.dataLayer || []
      // @ts-ignore
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: transactionId,
          order_id: transactionId,
          value: value,
          currency: currency.toUpperCase(),
          items: items.length > 0 ? items : undefined,
        },
      })
    }
  }, [transactionId, value, currency, items])

  return null
}
