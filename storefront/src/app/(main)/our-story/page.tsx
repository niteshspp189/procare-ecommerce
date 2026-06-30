import React from "react"

const OurStoryPage = () => {
    return (
        <div className="bg-white">
            {/* HERO SECTION BANNER */}
            <div className="relative h-[45vh] sm:h-[55vh] overflow-hidden flex items-center justify-center bg-black text-white">
                <div className="absolute inset-0 opacity-45">
                    <img src="/images/IMG_1572.webp" className="w-full h-full object-cover" alt="Our Story Banner" />
                </div>
                <div className="relative z-10 text-center animate-fade-in-up px-4 max-w-4xl">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4">Our Story</h1>
                    <p className="text-lg sm:text-2xl font-medium tracking-wide text-gray-200 italic">"Every great journey begins with a single step."</p>
                </div>
            </div>

            {/* MAIN STORY TEXT (NO INLINE IMAGES) */}
            <div className="py-16 sm:py-24 max-w-4xl mx-auto px-6 sm:px-8 text-gray-800 leading-relaxed">
                <div className="space-y-8 text-base sm:text-lg lg:text-xl font-normal text-justify sm:text-left">
                    <p>
                        At <span className="font-semibold text-black">MV Shoecare</span>, our journey began in 2009 with a simple belief: footwear deserves care that matches the craftsmanship behind it.
                    </p>
                    <p>
                        What started as a passion for premium shoe care soon evolved into a mission to bring world-class footwear care solutions to consumers across India and beyond. Our early association with leading international brands helped us understand global standards, advanced formulations, and the science behind preserving footwear. This foundation continues to inspire everything we create today.
                    </p>
                    <p>
                        In 2016, we launched <span className="font-bold text-black">PRO</span>, our flagship brand, with a vision to make professional shoe care accessible, effective, and easy to use for everyone. From leather care and sneaker care to accessories, insoles, and foot care solutions, PRO was designed to help consumers extend the life of their footwear while looking and feeling their best.
                    </p>
                    <p>
                        Today, our products are trusted by consumers, footwear brands, retailers, and partners across India and international markets. Behind every product lies a commitment to innovation, quality, and continuous improvement. We work closely with leading formulation experts, raw material partners, and laboratories to bring global expertise into every solution we create.
                    </p>
                    <p>
                        From premium leather shoes and everyday sneakers to foot comfort products and accessories, our goal remains unchanged:
                    </p>
                    <div className="py-6 my-8 border-y border-gray-200 text-center">
                        <p className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-black">
                            To redefine shoe care through quality, innovation, and ease of use.
                        </p>
                    </div>
                    <p className="font-medium text-black">
                        As we continue to grow, we remain driven by the same values that shaped our beginnings:
                    </p>
                </div>

                {/* VALUES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 pt-8 border-t border-gray-100">
                    <div className="p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-bold uppercase text-lg text-black mb-2 tracking-wide">Quality First</h3>
                        <p className="text-sm sm:text-base text-gray-600">Products crafted to deliver professional results you can trust.</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-bold uppercase text-lg text-black mb-2 tracking-wide">Innovation with Purpose</h3>
                        <p className="text-sm sm:text-base text-gray-600">Thoughtfully designed solutions that make shoe care simple and effective.</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-bold uppercase text-lg text-black mb-2 tracking-wide">Global Expertise, Made in India</h3>
                        <p className="text-sm sm:text-base text-gray-600">Combining international know-how with world-class manufacturing in India.</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl">
                        <h3 className="font-bold uppercase text-lg text-black mb-2 tracking-wide">Care Beyond Products</h3>
                        <p className="text-sm sm:text-base text-gray-600">Helping consumers protect, maintain, and enjoy their footwear for longer.</p>
                    </div>
                </div>

                {/* CLOSING STATEMENT */}
                <div className="mt-16 text-center space-y-2">
                    <p className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">Because every pair has a story.</p>
                    <p className="text-xl sm:text-2xl font-semibold text-[#0bb799]">And we're here to help it last.</p>
                </div>
            </div>

            {/* BRAND PROMISE BANNER */}
            <div className="mb-16 mx-4 sm:mx-8 bg-black rounded-2xl lg:rounded-3xl p-8 sm:p-16 text-center text-white relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-gray-400 mb-4 uppercase">Trusted Worldwide</p>
                    <h2 className="text-[clamp(22px,4vw,44px)] font-black uppercase leading-tight mb-8">Join the Revolution in Footwear Care</h2>
                    <a href="/shop" className="bg-[#0bb799] text-white px-8 sm:px-12 py-3.5 rounded-full font-bold text-base hover:bg-[#099980] transition-all shadow-lg inline-block uppercase tracking-wider">Shop The Collection</a>
                </div>
            </div>
        </div>
    )
}

export default OurStoryPage
