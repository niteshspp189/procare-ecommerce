import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund policy for ProPremiumCare.",
}

export default function RefundPolicy() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Refund Policy</h1>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Welcome to our Refund Policy page. We strive to ensure our customers are fully satisfied with every purchase. However, if you are not entirely satisfied, we are here to help. This policy outlines the conditions under which refunds and returns are accepted.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging. Certain types of goods are exempt from being returned, such as perishable items or personalized goods.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your credit card (or original method of payment).
      </p>
      <p className="text-gray-600 max-w-3xl text-center">
        This page is currently being updated. Please check back later for our full Refund Policy details and contact information for our support team.
      </p>
    </div>
  )
}
