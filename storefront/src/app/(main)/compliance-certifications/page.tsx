import React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Compliance & Certifications | PRO Premium Care",
  description: "Our Quality Management System is aligned with ISO 9001 principles and SEDEX ethical standards.",
}

export default function ComplianceCertificationsPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      {/* HERO BANNER - LIGHT & ELEGANT (Same treatment as Contact Us page) */}
      <div className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-teal-50/20 to-white text-center border-b border-gray-100 relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
            Compliance &amp; Certifications
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto tracking-wide">
            Following ethical standards
          </p>
        </div>
      </div>

      {/* INTRO PARAGRAPH - Reduced font size by 4px */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-12 pb-8 text-center">
        <p className="text-sm sm:text-base font-normal text-gray-600 leading-relaxed max-w-3xl mx-auto">
          Our Quality Management System is aligned with <span className="font-semibold text-gray-900">ISO 9001</span> principles and the <span className="font-semibold text-gray-900">SEDEX</span> ethical standards, ensuring consistent quality, responsible sourcing, and continuous improvement across our manufacturing value chain.
        </p>
      </div>

      {/* THREE CARDS GRID */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,189,165,0.08)] transition-all duration-300 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-[#00bda5]/10 flex items-center justify-center text-[#00bda5] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">ISO 9001:2015 Certified</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
              Effective process control, continuous improvement, and consistent product quality.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,189,165,0.08)] transition-all duration-300 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-[#00bda5]/10 flex items-center justify-center text-[#00bda5] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">SEDEX Certified / Member</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
              Ethical trade practices covering labor standards, health &amp; safety, environmental responsibility, and business ethics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_25px_rgba(0,189,165,0.08)] transition-all duration-300 flex flex-col items-start">
            <div className="w-10 h-10 rounded-xl bg-[#00bda5]/10 flex items-center justify-center text-[#00bda5] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">Internal Quality Management System (QMS)</h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-normal">
              Regular internal audits, supplier evaluations, and quality inspections to ensure compliance from sourcing to final dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8 text-center">
        <div className="p-6 sm:p-8 rounded-2xl bg-gray-50/70 border border-gray-100 text-gray-600 font-normal text-sm sm:text-base leading-relaxed shadow-xs">
          Our adherence to these standards reflects our commitment to delivering high-quality, compliant, and responsible products to our customers worldwide.
        </div>
      </div>

      {/* SECTION 2: EMBEDDED AT EVERY STAGE */}
      <div className="bg-slate-50/50 py-12 mt-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
              Quality is embedded at every stage of our operations
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-normal">
              Quality is embedded at every stage of our operations through a structured Quality Management System (QMS) aligned with internationally recognized standards.
            </p>
          </div>

          <div className="space-y-6">
            {/* Item 1 */}
            <div className="pl-5 sm:pl-6 border-l-3 border-[#00bda5] py-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                ISO 9001 – Quality Management System
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
                Our processes follow the principles of ISO 9001, ensuring consistent product quality, process control, risk management, and continuous improvement across development, sourcing, and production.
              </p>
            </div>

            {/* Item 2 */}
            <div className="pl-5 sm:pl-6 border-l-3 border-[#00bda5] py-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                SEDEX – Ethical &amp; Responsible Sourcing
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
                We align with SEDEX requirements to promote ethical business practices, fair labor conditions, health &amp; safety, and responsible supply chain management.
              </p>
            </div>

            {/* Item 3 */}
            <div className="pl-5 sm:pl-6 border-l-3 border-[#00bda5] py-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                Internal Quality Management System (QMS)
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-normal">
                From raw material selection to final dispatch, products undergo defined quality checkpoints, inspections, and performance evaluations to meet internal and customer-specific requirements. Regular internal audits, supplier evaluations, and corrective actions help us maintain compliance, enhance efficiency, and deliver reliable, safe, and high-quality products.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
