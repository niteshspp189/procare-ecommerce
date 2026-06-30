import React from "react"

const FAQPage = () => {
    const faqCategories = [
        {
            category: "1. Customer Related FAQs",
            items: [
                {
                    q: "How can I place an order?",
                    a: "You can place an order directly through our website by selecting the product, adding it to your cart, and completing the checkout process using your preferred payment method."
                },
                {
                    q: "What payment methods do you accept?",
                    a: "We accept Credit Cards, Debit Cards, UPI, Net Banking."
                },
                {
                    q: "How long does delivery take?",
                    a: "Orders are typically delivered within 5–7 business days depending on your location and courier service availability."
                },
                {
                    q: "Can I cancel my order?",
                    a: "Yes, orders can be cancelled before they are shipped. Once shipped, cancellation may not be possible."
                },
                {
                    q: "How do I track my order?",
                    a: "Once your order is shipped, you will receive a tracking link via email or SMS which can be used to track the delivery status."
                },
                {
                    q: "What is your return policy?",
                    a: "Customers can request a return or replacement within 7 days of delivery if the product is damaged, defective, or incorrect."
                },
                {
                    q: "How do I request a return or replacement?",
                    a: "You can email our support team at customer@mvscindia.com with your Order ID, product images, and a description of the issue only in case of damage, defective or incorrect."
                },
                {
                    q: "How long does a refund take?",
                    a: "Refunds are processed within 24–48 business hours after product verification and may take 4–5 additional days to reflect in your bank account."
                },
                {
                    q: "Do you offer Cash on Delivery (COD)?",
                    a: "No, Cash on Delivery is not available."
                },
                {
                    q: "Do you offer bulk purchase or wholesale options?",
                    a: "Yes, we support bulk orders and business partnerships. Please contact us through our business inquiry (B2B) section for more details."
                }
            ]
        },
        {
            category: "2. General Product FAQs",
            items: [
                {
                    q: "Are your shoe care products safe to use?",
                    a: "Yes, our products are tested for safety and performance and are suitable for regular use on shoes and accessories."
                },
                {
                    q: "Are the products eco-friendly?",
                    a: "Many of our formulations are non-toxic and water-based."
                },
                {
                    q: "Where are your products manufactured?",
                    a: "Products are manufactured under strict quality standards using high-quality ingredients."
                },
                {
                    q: "Do your products work on bags and accessories?",
                    a: "Yes, many cleaners and brushes can also be used on leather bags, wallets, belts, and jackets."
                }
            ]
        },
        {
            category: "3. Shoe Cleaner & Shampoo FAQs",
            items: [
                {
                    q: "Can shoe cleaner be used on sneakers?",
                    a: "Yes, most cleaners are suitable for sneakers, canvas, leather, and synthetic materials."
                },
                {
                    q: "Can your products be used on all types of shoes?",
                    a: "Most products are suitable for leather, synthetic leather, canvas, sneakers, and textiles. Please check the product label for specific instructions."
                },
                {
                    q: "How often should I use shoe cleaner?",
                    a: "For best results, shoe cleaner can be used once every 1–2 weeks depending on how frequently the shoes are used."
                },
                {
                    q: "Does shoe shampoo remove tough stains?",
                    a: "Yes, shoe shampoo helps remove dirt and stains while being gentle on shoe material."
                },
                {
                    q: "Can I use shoe cleaner on white shoes?",
                    a: "Yes, shoe cleaner is especially effective for maintaining white sneakers and canvas shoes."
                },
                {
                    q: "Is shoe cleaner safe for fabric shoes?",
                    a: "Yes, most formulas are designed to be safe for fabric and textile materials."
                }
            ]
        },
        {
            category: "4. Shoe Cream & Polish FAQs",
            items: [
                {
                    q: "Does shoe cream restore the color of leather shoes?",
                    a: "Yes, shoe cream helps restore faded color, nourish leather, and provide shine and protection."
                },
                {
                    q: "Can shoe cream repair cracked leather?",
                    a: "Shoe cream can improve the appearance of minor cracks by moisturizing leather."
                },
                {
                    q: "How often should I apply shoe cream?",
                    a: "Applying shoe cream once every 2–3 weeks helps maintain leather quality."
                },
                {
                    q: "Is shoe cream suitable for synthetic leather?",
                    a: "Yes, many shoe creams can be used on both leather and synthetic leather materials."
                }
            ]
        },
        {
            category: "5. Shoe Deodorizer FAQs",
            items: [
                {
                    q: "What does shoe deodorizer do?",
                    a: "Shoe deodorizer eliminates unpleasant odors and keeps shoes fresh."
                },
                {
                    q: "How often should I use shoe deodorizer?",
                    a: "It can be used daily or after each use for best results."
                },
                {
                    q: "Does deodorizer kill bacteria?",
                    a: "Yes, many formulas help control odor-causing bacteria and fungi."
                },
                {
                    q: "Is shoe deodorizer safe for all shoe materials?",
                    a: "Yes, most deodorizers are safe for sneakers, canvas, textiles, and synthetic materials."
                },
                {
                    q: "Can the shoe deodorizer remove bad odors?",
                    a: "Yes, shoe deodorizer helps neutralize unpleasant odors, control bacteria, and keep shoes fresh."
                }
            ]
        },
        {
            category: "6. Insoles FAQs",
            items: [
                {
                    q: "How do I use shoe insoles?",
                    a: "Remove the existing insole, align it with the new insole, trim if required, and insert it into the shoe."
                },
                {
                    q: "What are shoe insoles used for?",
                    a: "Insoles provide cushioning, comfort, and support while walking or standing."
                },
                {
                    q: "Can insoles help reduce foot fatigue?",
                    a: "Yes, cushioned insoles absorb shock and reduce pressure on feet."
                },
                {
                    q: "Can insoles be trimmed to size?",
                    a: "Yes, most insoles can be trimmed to match the shape of your shoe."
                },
                {
                    q: "How long do insoles last?",
                    a: "Depending on usage, insoles typically last 3–6 months."
                },
                {
                    q: "Are insoles suitable for sports shoes?",
                    a: "Yes, insoles can be used in sneakers, sports shoes, and casual footwear."
                }
            ]
        },
        {
            category: "7. Shoe Brush & Suede Brush FAQs",
            items: [
                {
                    q: "Can I use a suede brush on leather shoes?",
                    a: "No. Suede brushes are specifically designed for suede and nubuck materials. For leather shoes, use a polish brush or soft cloth."
                },
                {
                    q: "What is a suede brush used for?",
                    a: "A suede brush helps clean suede and nubuck materials and restore their natural texture."
                },
                {
                    q: "How often should I brush suede shoes?",
                    a: "Light brushing after every few uses helps maintain suede texture."
                },
                {
                    q: "What is a shoe polish brush used for?",
                    a: "A polish brush helps spread shoe cream or polish evenly on leather shoes."
                }
            ]
        },
        {
            category: "8. Personal Care Tools FAQs",
            items: [
                {
                    q: "Is the nail clipper made of stainless steel?",
                    a: "Yes, our nail clippers are typically made with high-quality stainless steel for durability and long-lasting sharpness."
                },
                {
                    q: "How should I clean the nail clipper?",
                    a: "After use, wipe the clipper with a clean cloth or disinfectant wipe to maintain hygiene."
                },
                {
                    q: "Can nail clippers cause nail damage?",
                    a: "No, when used properly, nail clippers help maintain healthy nails and prevent breakage or splitting."
                },
                {
                    q: "What is a nail filer used for?",
                    a: "A nail filer helps smooth rough nail edges and shape nails after trimming."
                },
                {
                    q: "Can nail filers be used on natural and artificial nails?",
                    a: "Yes, nail filers are suitable for natural nails and some artificial nails, depending on the filer type."
                },
                {
                    q: "How often should I replace a nail filer?",
                    a: "Depending on usage, a nail filer should be replaced every 3–6 months or when it becomes worn out."
                },
                {
                    q: "What is a pumice stone used for?",
                    a: "A pumice stone is used to remove dead skin, calluses, and rough patches from feet, leaving skin smoother and softer."
                },
                {
                    q: "How do I use a pumice stone?",
                    a: "Soak your feet in warm water for 5–10 minutes, gently rub the pumice stone on rough areas, then rinse and moisturize your feet afterward."
                },
                {
                    q: "How often should I use a pumice stone?",
                    a: "Using it 1–2 times per week helps maintain soft and smooth feet."
                },
                {
                    q: "Is pumice stone safe for sensitive skin?",
                    a: "Yes, but it should be used gently to avoid skin irritation."
                },
                {
                    q: "How do I clean a pumice stone?",
                    a: "Rinse it with warm water after each use and allow it to dry completely."
                },
                {
                    q: "Can pumice stones remove deep calluses?",
                    a: "Pumice stones help reduce mild to moderate calluses. Severe calluses may require professional treatment."
                }
            ]
        }
    ]

    return (
        <div className="py-16 sm:py-24 bg-white">
            <div className="max-w-4xl mx-auto px-6 sm:px-8">
                <h1 className="text-3xl sm:text-5xl font-black uppercase mb-4 text-center tracking-tight">Frequently Asked Questions</h1>
                <p className="text-gray-500 text-center mb-12 sm:mb-16 text-base sm:text-lg">Everything you need to know about PRO shoe care products, orders, and usage.</p>
                
                <div className="space-y-12 sm:space-y-16">
                    {faqCategories.map((cat, idx) => (
                        <div key={idx} className="bg-gray-50/60 p-6 sm:p-8 rounded-2xl border border-gray-100">
                            <h2 className="text-xl sm:text-2xl font-black text-black uppercase mb-6 pb-3 border-b border-gray-200 tracking-wide">
                                {cat.category}
                            </h2>
                            <div className="space-y-6">
                                {cat.items.map((faq, i) => (
                                    <div key={i} className="pb-6 border-b border-gray-200/60 last:border-0 last:pb-0">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 leading-snug">{faq.q}</h3>
                                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FAQPage
