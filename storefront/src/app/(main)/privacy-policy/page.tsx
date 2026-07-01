import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for ProPremiumCare.",
}

export default function PrivacyPolicy() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Privacy Policy</h1>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. Any changes or modifications will be effective immediately upon posting the updated Privacy Policy on the Site.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        We may collect information about you in a variety of ways. The information we may collect on the Site includes personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information.
      </p>
      <p className="text-gray-600 max-w-3xl text-center">
        This page is currently being updated. Please check back later for our full Privacy Policy details and contact information for our support team.
      </p>
    </div>
  )
}
