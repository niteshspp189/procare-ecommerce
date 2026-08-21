"use client"

import { useEffect } from "react"

export default function GooglePurchaseTracker({
  transactionId,
  value,
  currency = "INR",
}: {
  transactionId: string
  value: number | null | undefined
  currency?: string
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
          value: value,
          currency: currency.toUpperCase(),
        },
      })
    }
  }, [transactionId, value, currency])

  return null
}
