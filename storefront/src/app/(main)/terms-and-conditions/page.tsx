import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for MV Shoe Care.",
}

export default function TermsAndConditions() {
  return (
    <div className="py-16 px-4 md:px-8 max-w-4xl mx-auto min-h-[50vh]">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Terms & Conditions</h1>
      <div className="prose prose-slate max-w-none text-gray-700">

        <p className="mb-8">Welcome to MV Shoe Care. By accessing or purchasing from our website, you agree to the following Terms & Conditions.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">1. General</h2>
        <p className="mb-6">MV Shoe Care reserves the right to modify these Terms & Conditions at any time without prior notice. Continued use of our website constitutes acceptance of the updated terms.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">2. Products</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>We strive to display product images and descriptions as accurately as possible.</li>
            <li>Actual product color, packaging, or appearance may vary slightly due to manufacturing updates or screen settings.</li>
            <li>Product availability is subject to stock.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">3. Pricing</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>All prices are displayed in Indian Rupees (INR).</li>
            <li>Prices are inclusive of applicable taxes unless otherwise mentioned.</li>
            <li>We reserve the right to revise prices without prior notice.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">4. Orders</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Orders are confirmed only after successful payment.</li>
            <li>MV Shoe Care reserves the right to cancel any order due to stock unavailability, pricing errors, or suspected fraudulent activity.</li>
            <li>If an order is cancelled after payment, the amount will be refunded to the original payment method.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">5. Intellectual Property</h2>
        <p className="mb-6">All content including logos, product images, graphics, text, and website design are the intellectual property of MV Shoe Care and may not be copied or reproduced without written permission.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">6. Limitation of Liability</h2>
        <p className="mb-6">MV Shoe Care shall not be liable for any indirect, incidental, or consequential damages arising from the use or misuse of our products.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">7. Governing Law</h2>
        <p className="mb-6">These Terms & Conditions shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Noida, Uttar Pradesh.</p>
      </div>
    </div>
  )
}
