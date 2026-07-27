import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Exchange Policy",
  description: "Shipping & Exchange Policy for ProPremiumCare.",
}

export default function ShippingAndExchange() {
  return (
    <div className="py-16 px-4 md:px-8 max-w-4xl mx-auto min-h-[50vh]">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Shipping & Exchange Policy</h1>
      <div className="prose prose-slate max-w-none text-gray-700">


        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Shipping</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>We ship orders across India through our trusted logistics partner Shiprocket.</li>
          <li>Standard delivery time is 5–7 business days from the date of dispatch.</li>
          <li>Delivery timelines may vary due to remote locations, weather conditions, public holidays, or courier delays.</li>
          <li>Customers will receive shipment tracking details once the order has been dispatched.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Order Processing</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Orders are generally processed within 1–2 business days.</li>
          <li>Orders placed on Sundays or public holidays will be processed on the next working day.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Exchange & Return</h2>
        <p className="mb-4">15-day return policy applicable for defective or wrong product delivery.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">To request an exchange or return:</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Contact our customer support within 15 days of delivery.</li>
          <li>Share your Order ID along with clear photographs or videos of the damaged product.</li>
          <li>Our team will verify the claim.</li>
          <li>Once approved, a replacement or refund will be processed.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Returns/Exchanges are NOT accepted for:</h2>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Used products</li>
          <li>Products damaged after delivery</li>
          <li>Change of mind</li>
          <li>Incorrect product ordered by the customer</li>
          <li>Normal wear and tear</li>
        </ul>
        <p className="mb-8">Products must be returned in their original packaging with all accessories, labels, and invoices.</p>
      </div>
    </div>
  )
}
