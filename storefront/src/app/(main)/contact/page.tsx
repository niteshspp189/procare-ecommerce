import { Metadata } from "next"
import EnquiryForm from "@modules/contact/components/enquiry-form"

export const metadata: Metadata = {
    title: "Contact Us | Pro Premium Care",
    description: "Get in touch with Pro Premium Care for any inquiries about our high-quality shoe and foot care products.",
}

const s = {
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 16px',
    },
    label: {
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase' as const,
        color: '#64748b',
        letterSpacing: '1.5px',
        marginBottom: '6px',
        display: 'block',
    },
    value: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '20px',
        display: 'block',
        lineHeight: '1.5'
    },
}

export default function ContactPage() {
    return (
        <div className="animate-fade-in bg-white">
            {/* HERO BANNER - LIGHT & ELEGANT */}
            <div className="py-12 sm:py-16 bg-gradient-to-b from-slate-50 via-teal-50/20 to-white text-center border-b border-gray-100 relative">
                <div className="pro-container relative z-10">
                    <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-3">Contact Us</h1>
                    <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base font-medium">
                        Have questions or need assistance? We're here to help you find the perfect shoe and foot care solution.
                    </p>
                </div>
            </div>

            <div style={s.content}>
                {/* ROW 1: Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12 lg:mb-16">
                    <div className="space-y-8 lg:space-y-10">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 lg:mb-8 tracking-tight">Get in Touch</h2>
                            <div className="space-y-6">
                                <div>
                                    <span style={s.label}>Headquarters / Manufactured & Marketed By</span>
                                    <span style={s.value}>M V SHOE CARE PVT LTD<br />A-13, Sector – 59, Noida, Uttar Pradesh 201301, India</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <span style={s.label}>Email Address</span>
                                        <a href="mailto:customercare@mvscindia.com" style={s.value} className="hover:text-teal-600 transition-colors">customercare@mvscindia.com</a>
                                    </div>
                                    <div>
                                        <span style={s.label}>Phone / WhatsApp</span>
                                        <a href="tel:9958410042" style={s.value} className="hover:text-teal-600 transition-colors">+91 9958410042<br />0120-4299679</a>
                                    </div>
                                </div>

                                <div>
                                    <span style={s.label}>Working Hours</span>
                                    <div className="flex gap-8 lg:gap-12">
                                        <div>
                                            <span className="block text-gray-900 font-semibold text-sm">MON - SAT</span>
                                            <span className="block text-gray-500 text-xs font-medium uppercase mt-0.5">9:00 AM - 6:00 PM</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-900 font-semibold text-sm">SUNDAY</span>
                                            <span className="block text-gray-500 text-xs font-medium uppercase mt-0.5">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LIVE SUPPORT BOX */}
                        <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-100 text-gray-800 p-6 lg:p-7 rounded-2xl relative overflow-hidden shadow-xs">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-9 h-9 rounded-full bg-[#0bb799] flex items-center justify-center text-white shadow-xs shrink-0">
                                   <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Live Support</h3>
                            </div>
                            <p className="text-gray-600 mb-5 text-sm leading-relaxed font-normal">Need immediate help with an order or have a product question? Our dedicated support team is available during working hours.</p>
                            <a
                                href="https://wa.me/919958410042"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-[#0bb799] text-white font-semibold py-3 rounded-xl hover:bg-[#099980] hover:-translate-y-0.5 transition-all text-xs tracking-wide shadow-sm hover:shadow-md"
                            >
                                Chat on WhatsApp
                            </a>
                        </div>
                    </div>

                    <div>
                        <EnquiryForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
