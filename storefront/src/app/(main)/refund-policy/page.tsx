import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund Policy for ProPremiumCare.",
}

export default function RefundPolicy() {
  return (
    <div className="py-16 px-4 md:px-8 max-w-4xl mx-auto min-h-[50vh]">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Refund Policy</h1>
      <div className="prose prose-slate max-w-none text-gray-700">

        <p className="mb-8">At MV Shoe Care, we are committed to providing quality products.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Eligibility</h2>
        <p className="mb-2">Refunds are only applicable if:</p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>The product received is damaged or defective.</li>
          <li>The issue is reported within 15 days of delivery.</li>
          <li>The claim is verified by our support team.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Non-Refundable Cases</h2>
        <p className="mb-2">Refunds will not be provided for:</p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Change of mind</li>
          <li>Wrong product ordered by the customer</li>
          <li>Used or damaged products after delivery</li>
          <li>Normal wear and tear</li>
          <li>Minor packaging damage that does not affect the product</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Refund Process</h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Contact customer support with your Order ID.</li>
          <li>Share photos or videos of the damaged product.</li>
          <li>After verification, we will approve the refund.</li>
        </ul>
        <p className="mb-8">Refunds will be processed to the original payment method within 5–7 business days after approval.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Replacement Option</h2>
        <p className="mb-8">Where applicable, MV Shoe Care may offer a replacement instead of a refund.</p>
      </div>
    </div>
  )
}
