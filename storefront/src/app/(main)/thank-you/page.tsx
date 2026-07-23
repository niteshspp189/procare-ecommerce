import React from "react"
import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MetaPurchaseTracker from "@modules/order/components/meta-purchase-tracker"

export const metadata: Metadata = {
  title: "Thank You for Your Order | PRO Premium Care",
  description: "Thank you for shopping with PRO Premium Care. Your order has been successfully placed.",
  robots: {
    index: false,
    follow: true,
  },
}

export default async function ThankYouPage(props: { searchParams?: Promise<{ amount?: string }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {}
  const totalAmount = searchParams.amount ? parseFloat(searchParams.amount) : 293

  return (
    <div className="bg-white min-h-[75vh] flex items-center justify-center font-sans py-16 px-4">
      <MetaPurchaseTracker total={totalAmount} currencyCode="INR" />
      <div className="max-w-xl w-full text-center space-y-8 animate-fade-in">
        {/* Success Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading & Paragraph */}
        <div className="space-y-3">
          <span className="inline-block py-1 px-3 rounded-full bg-[#00bda5]/10 text-[#00bda5] text-xs font-bold uppercase tracking-widest border border-[#00bda5]/20">
            Order Confirmed
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Thank You for Your Order!
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg mx-auto font-normal">
            Thank you for shopping with PRO Premium Care. Your order has been successfully placed, and our team is preparing it for dispatch.
          </p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            You will receive an order confirmation email and SMS tracking update shortly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <LocalizedClientLink
            href="/shop"
            className="w-full sm:w-auto bg-[#00bda5] hover:bg-[#00a38f] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg text-sm uppercase tracking-wider text-center"
          >
            Continue Shopping
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account"
            className="w-full sm:w-auto bg-gray-50 hover:bg-gray-100 text-gray-800 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 transition-all text-sm uppercase tracking-wider text-center"
          >
            View Account &amp; Orders
          </LocalizedClientLink>
        </div>

        {/* Customer Support Note */}
        <div className="pt-8 border-t border-gray-100 text-xs text-gray-400">
          Need help with your order? Contact our support team at{" "}
          <a href="mailto:support@propremiumcare.com" className="text-[#00bda5] font-semibold hover:underline">
            support@propremiumcare.com
          </a>
        </div>
      </div>
    </div>
  )
}
