import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Exchange",
  description: "Shipping and exchange policy for ProPremiumCare.",
}

export default function ShippingAndExchange() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Shipping & Exchange</h1>
      <p className="text-gray-600 max-w-2xl text-center">
        This page is currently being updated. Please check back later for our full Shipping & Exchange policy.
      </p>
    </div>
  )
}
