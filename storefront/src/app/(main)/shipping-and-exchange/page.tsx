import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Exchange",
  description: "Shipping and exchange policy for ProPremiumCare.",
}

export default function ShippingAndExchange() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4 font-sans">
      <h1 className="text-4xl font-bold mb-4 text-center">Shipping & Exchange</h1>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Thank you for visiting and shopping with us. Following are the terms and conditions that constitute our Shipping & Exchange Policy. All orders are processed within 2-3 business days. Orders are not shipped or delivered on weekends or holidays.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in shipment of your order, we will contact you via email or telephone.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Shipping charges for your order will be calculated and displayed at checkout. Delivery delays can occasionally occur. You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s).
      </p>
      <p className="text-gray-600 max-w-3xl text-center">
        This page is currently being updated. Please check back later for our full Shipping & Exchange policy details and contact information for our support team.
      </p>
    </div>
  )
}
