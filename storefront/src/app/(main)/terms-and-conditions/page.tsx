import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for ProPremiumCare.",
}

export default function TermsAndConditions() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Terms & Conditions</h1>
      <p className="text-gray-600 max-w-2xl text-center">
        This page is currently being updated. Please check back later for the full Terms & Conditions.
      </p>
    </div>
  )
}
