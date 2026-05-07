import { Metadata } from "next"
import Support from "@modules/account/components/support"

import { listOrders } from "@lib/data/orders"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Support & Complaints",
  description: "Raise a complaint for your order.",
}

export default async function SupportPage() {
  const orders = await listOrders().catch(() => null)

  if (!orders) {
    return notFound()
  }

  return (
    <div className="w-full" data-testid="support-page-container">
      <Support orders={orders} />
    </div>
  )
}
