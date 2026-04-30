import { Metadata } from "next"
import EnquiryForm from "@modules/contact/components/enquiry-form"

export const metadata: Metadata = {
    title: "Contact Us | Pro Premium Care",
    description: "Get in touch with Pro Premium Care for any inquiries about our high-quality shoe and foot care products.",
}

const s = {
    hero: {
        padding: '60px 0 40px',
        backgroundColor: '#000',
        color: '#fff',
        textAlign: 'center' as const,
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 16px',
    },
    label: {
        fontSize: '10px',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        color: '#999',
        letterSpacing: '2px',
        marginBottom: '6px',
        display: 'block',
    },
    value: {
        fontSize: '16px',
        fontWeight: '800',
        color: '#000',
        marginBottom: '20px',
        display: 'block',
        lineHeight: '1.4'
    },
}

export default function ContactPage() {
    return (
        <div className="animate-fade-in bg-white">
            {/* HERO */}
            <div style={s.hero}>
                <div className="pro-container">
                    <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4">Contact Us</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto uppercase tracking-widest text-[10px] sm:text-[11px] font-bold">We're here to help you every step of the way</p>
                </div>
            </div>

            <div style={s.content}>
                {/* ROW 1: Details & Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-12 lg:mb-20">
                    <div className="space-y-8 lg:space-y-12">
                        <div>
                            <h2 className="text-2xl sm:text-4xl font-black uppercase mb-8 lg:mb-12 tracking-tight">Get In Touch</h2>
                            <div className="space-y-6 lg:space-y-10">
                                <div>
                                    <span style={s.label}>Headquarters</span>
                                    <span style={s.value}>A-13, Sector – 59, Noida, Uttar Pradesh 201301, India</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                                    <div>
                                        <span style={s.label}>Email Address</span>
                                        <a href="mailto:connect@mvscindia.com" style={s.value} className="hover:text-gray-600 transition-colors">connect@mvscindia.com</a>
                                    </div>
                                    <div>
                                        <span style={s.label}>Phone Number</span>
                                        <a href="tel:0120-4299679" style={s.value} className="hover:text-gray-600 transition-colors">0120-4299679</a>
                                    </div>
                                </div>

                                <div>
                                    <span style={s.label}>Working Hours</span>
                                    <div className="flex gap-6 lg:gap-12">
                                        <div>
                                            <span className="block text-black font-extrabold text-sm">MON - SAT</span>
                                            <span className="block text-gray-500 text-xs font-bold uppercase mt-1">9:00 AM - 6:00 PM</span>
                                        </div>
                                        <div>
                                            <span className="block text-black font-extrabold text-sm">SUNDAY</span>
                                            <span className="block text-gray-500 text-xs font-bold uppercase mt-1">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-black text-white p-6 lg:p-12 rounded-2xl lg:rounded-3xl relative overflow-hidden group">
                            <h3 className="text-xl lg:text-2xl font-black mb-4 uppercase italic">Live Support</h3>
                            <p className="text-gray-400 mb-6 lg:mb-8 text-sm leading-relaxed">Need immediate help with an order or have a product question? Our dedicated support team is available during working hours.</p>
                            <a
                                href="https://wa.me/911204299679"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-white text-black font-black py-3 lg:py-4 rounded-full hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Chat on WhatsApp
                            </a>
                            <div className="absolute top-0 right-0 w-24 lg:w-32 h-24 lg:h-32 bg-gray-800 rounded-full -mr-12 lg:-mr-16 -mt-12 lg:-mt-16 opacity-50 blur-2xl"></div>
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
