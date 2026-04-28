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
                            <h2 className="text-2xl sm:text-4xl font-black uppercase mb-8 lg:mb-12 tracking-tight">Get In <br /> Touch</h2>
                            <div className="space-y-6 lg:space-y-10">
                                <div>
                                    <span style={s.label}>Headquarters</span>
                                    <span style={s.value}>A-13, Sector – 59, Noida, <br />Uttar Pradesh 201301, India</span>
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
                            <button className="w-full bg-white text-black font-black py-3 lg:py-4 rounded-full hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">
                                Chat With Support
                            </button>
                            <div className="absolute top-0 right-0 w-24 lg:w-32 h-24 lg:h-32 bg-gray-800 rounded-full -mr-12 lg:-mr-16 -mt-12 lg:-mt-16 opacity-50 blur-2xl"></div>
                        </div>
                    </div>

                    <div>
                        <EnquiryForm />
                    </div>
                </div>

                {/* ROW 2: Map (Full Width) */}
                <div className="space-y-6 lg:space-y-8 pt-6 lg:pt-10 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight">Our Location</h2>
                        <a
                            href="https://maps.app.goo.gl/b8dputsQrPKtj969A"
                            target="_blank"
                            className="text-[11px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-600 hover:border-gray-600 transition-all"
                        >
                            Open in Google Maps
                        </a>
                    </div>
                    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl relative">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.456789123456!2d77.375!3d28.595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce563fd6e7e1b%3A0xe2126e84d436ec27!2sA-13%2C%20Sector%2059%2C%20Noida%2C%20Uttar%20Pradesh%20201301!5e0!3m2!1sen!2sin!4v1713530000000!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    )
}
