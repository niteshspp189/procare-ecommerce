import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for ProPremiumCare.",
}

export default function PrivacyPolicy() {
  return (
    <div className="py-16 px-4 md:px-8 max-w-4xl mx-auto min-h-[50vh]">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Privacy Policy</h1>
      <div className="prose prose-slate max-w-none text-gray-700">

        <p className="mb-8">At MV Shoe Care, we value your privacy and are committed to protecting your personal information.</p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Information We Collect</h2>
        <p className="mb-2">We may collect:</p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Shipping & billing address</li>
          <li>Payment information (processed securely through payment partners)</li>
          <li>Order history</li>
          <li>Device and browser information</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">How We Use Your Information</h2>
        <p className="mb-2">We use your information to:</p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>Process and deliver orders</li>
          <li>Provide customer support</li>
          <li>Send order updates</li>
          <li>Improve our website and services</li>
          <li>Communicate promotional offers (only where permitted)</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Data Protection</h2>
        <p className="mb-8">We implement appropriate security measures to safeguard your information against unauthorized access, disclosure, or misuse.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Third-Party Services</h2>
        <p className="mb-2">We may share necessary information with trusted service providers such as:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Payment gateways</li>
          <li>Shipping partners (Shiprocket)</li>
          <li>Analytics providers</li>
        </ul>
        <p className="mb-8">These providers only receive information necessary to perform their services.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Cookies</h2>
        <p className="mb-8">Our website uses cookies to improve browsing experience and website performance.</p>

        <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900">Your Rights</h2>
        <p className="mb-2">You may request to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Access your personal data</li>
          <li>Correct inaccurate information</li>
          <li>Delete your information (where legally permitted)</li>
        </ul>
        <p className="mb-8">For any privacy-related queries, please contact our customer support.</p>
      </div>
    </div>
  )
}
