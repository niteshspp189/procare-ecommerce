import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for ProPremiumCare.",
}

export default function TermsAndConditions() {
  return (
    <div className="py-12 flex flex-col items-center justify-center min-h-[50vh] px-4 font-sans">
      <h1 className="text-4xl font-bold mb-4 text-center">Terms & Conditions</h1>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Welcome to our website. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern our relationship with you in relation to this website.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        The term 'us' or 'we' refers to the owner of the website. The term 'you' refers to the user or viewer of our website. The content of the pages of this website is for your general information and use only. It is subject to change without notice.
      </p>
      <p className="text-gray-600 max-w-3xl text-center mb-6">
        Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors.
      </p>
      <p className="text-gray-600 max-w-3xl text-center">
        This page is currently being updated. Please check back later for the full Terms & Conditions and contact information for our support team.
      </p>
    </div>
  )
}
