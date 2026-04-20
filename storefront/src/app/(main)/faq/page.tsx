import React from "react"

const FAQPage = () => {
    const faqs = [
        {
            q: "How often should I use the kit?",
            a: "For best results, we recommend a deep clean every 2-4 weeks depending on usage."
        },
        {
            q: "Is it safe for all leather types?",
            a: "Yes, our formula is neutral pH balanced and safe for all smooth and treated leathers."
        },
        {
            q: "What is the return policy?",
            a: "We offer a 30-day no-questions-asked return policy for all sealed products."
        },
        {
            q: "Do you ship internationally?",
            a: "Yes, we ship to over 50 countries worldwide. Shipping rates vary by location."
        }
    ]

    return (
        <div className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-5xl font-black uppercase mb-12 text-center">Frequently Asked Questions</h1>
                <div className="space-y-8">
                    {faqs.map((faq, i) => (
                        <div key={i} className="border-b border-gray-100 pb-8">
                            <h3 className="text-xl font-bold uppercase mb-4">{faq.q}</h3>
                            <p className="text-gray-500 leading-relaxed uppercase text-sm tracking-tight">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FAQPage
