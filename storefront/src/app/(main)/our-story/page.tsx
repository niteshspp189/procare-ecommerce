import React from "react"
import CustomVideoPlayer from "./CustomVideoPlayer"

const AwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"></circle>
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
  </svg>
)

const FlaskIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v7.31L4.15 20.3c-.77 1.25.13 2.7 1.6 2.7h12.5c1.47 0 2.37-1.45 1.6-2.7L14 9.31V2"></path>
    <path d="M8.5 2h7"></path>
    <path d="M7 16h10"></path>
  </svg>
)

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
)

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
    <path d="M4 22h16"></path>
    <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"></path>
    <path d="M6 4h12v7a6 6 0 0 1-12 0V4Z"></path>
  </svg>
)

const OurStoryPage = () => {
    const trustPillars = [
        {
            title: "BACKED BY EUROPEAN EXPERTISE",
            description: "Formulated in collaboration with leading European laboratories and master chemical specialists.",
            image: "/images/our-story/backed-by-european-expertise.png",
            icon: <FlaskIcon />
        },
        {
            title: "15+ YEARS OF PROVEN EXCELLENCE",
            description: "Over a decade and a half of footwear care innovation, craftsmanship, and unwavering quality.",
            image: "/images/our-story/15-years-of-proven-excellence.png",
            icon: <AwardIcon />
        },
        {
            title: "TRUSTED IN 17+ COUNTRIES",
            description: "Delivering international standard shoe care products to footwear lovers across 17+ global markets.",
            image: "/images/our-story/trusted-in-17-countries.png",
            icon: <GlobeIcon />
        },
        {
            title: "INDIA'S NO. 1 LEADING SHOE CARE BRAND",
            description: "India's foremost choice for premium leather care, sneaker care, and foot comfort solutions.",
            image: "/images/our-story/indias-no-1-shoe-care-brand.png",
            icon: <TrophyIcon />
        }
    ]

    return (
        <div className="bg-white">
            {/* HERO BANNER */}
            <div className="relative overflow-hidden flex items-center justify-center bg-black text-white w-full" style={{aspectRatio: '1920 / 800', height: 'auto', maxHeight: '550px'}}>
                <div className="absolute inset-0">
                    <img src="/images/story-page-banner.png" className="w-full h-full object-cover object-center" alt="Our Story Banner" />
                </div>
            </div>

            {/* MAIN STORY TEXT & VIDEO */}
            <div className="py-14 sm:py-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-gray-800 leading-relaxed">
                <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                    {/* VIDEO LEFT */}
                    <div className="w-full lg:w-[55%] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative aspect-video bg-gray-50 flex-shrink-0 self-start hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-shadow duration-500">
                        <CustomVideoPlayer videoId="rCl2DY4quFI" />
                    </div>

                    {/* TEXT RIGHT */}
                    <div className="w-full lg:w-[45%] space-y-6 text-base sm:text-lg font-normal text-justify sm:text-left self-center text-gray-600">
                        <p>
                            At <span className="font-semibold text-black">MV Shoecare</span>, our journey began in 2009 with a simple belief: footwear deserves care that matches the craftsmanship behind it.
                        </p>
                        <p>
                            What started as a passion for premium shoe care soon evolved into a mission to bring world-class footwear care solutions to consumers across India and beyond. Our early association with leading international brands helped us understand global standards, advanced formulations, and the science behind preserving footwear. This foundation continues to inspire everything we create today.
                        </p>
                    </div>
                </div>

                {/* ADDITIONAL STORY TEXT (BELOW VIDEO) */}
                <div className="mt-12 lg:mt-16 space-y-6 text-base sm:text-lg font-normal text-justify sm:text-left text-gray-600">
                    <p>
                        In 2016, we launched <span className="font-bold text-black">PRO</span>, our flagship brand, with a vision to make professional shoe care accessible, effective, and easy to use for everyone. From leather care and sneaker care to accessories, insoles, and foot care solutions, PRO was designed to help consumers extend the life of their footwear while looking and feeling their best.
                    </p>
                    <p>
                        Today, our products are trusted by consumers, footwear brands, retailers, and partners across India and international markets. Behind every product lies a commitment to innovation, quality, and continuous improvement. We work closely with leading formulation experts, raw material partners, and laboratories to bring global expertise into every solution we create.
                    </p>
                    <p>
                        From premium leather shoes and everyday sneakers to foot comfort products and accessories, our goal remains unchanged:
                    </p>
                </div>

                {/* REDEFINE BANNER */}
                <div className="py-8 my-14 border border-[#0bb799]/30 rounded-2xl shadow-sm text-center bg-[#0bb799]/5 relative overflow-hidden">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-black px-4 relative z-10">
                        To redefine shoe care through quality, innovation, and ease of use.
                    </p>
                </div>

                {/* TRUST PILLARS HEAD */}
                <div className="text-center mb-10">
                    <p className="font-bold text-black uppercase tracking-wider text-base sm:text-lg md:text-xl">
                        As we continue to grow, we remain driven by the same values that shaped our beginnings:
                    </p>
                </div>

                {/* TRUST PILLARS GRID (Expanded cards with wider footprint and padding) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                    {trustPillars.map((pillar, idx) => (
                        <div 
                            key={idx} 
                            className="p-6 pb-7 bg-white border border-gray-100/90 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all duration-300 flex flex-col relative group"
                        >
                            <div className="absolute top-5 left-5 z-10 bg-[#0bb799] p-2 rounded-full text-white shadow-md">
                                {pillar.icon}
                            </div>
                            
                            <div className="w-full aspect-[362/297] rounded-xl overflow-hidden mb-5 relative bg-white flex items-center justify-center">
                                <img 
                                    src={pillar.image} 
                                    alt={pillar.title} 
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            
                            <h3 className="font-bold uppercase text-sm sm:text-[15px] text-black mb-2 tracking-wide text-center leading-snug">
                                {pillar.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed px-1">
                                {pillar.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* EVERY PAIR HAS A STORY BANNER (Framed, well-proportioned container) */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 my-8">
                <div className="rounded-3xl overflow-hidden shadow-2xl bg-black border border-gray-900">
                    <img 
                        src="/images/our-story/every-pair-has-a-story.png" 
                        alt="Because every pair has a story. And we're here to help it last." 
                        className="w-full h-auto object-cover rounded-3xl"
                    />
                </div>
            </div>

            {/* BRAND PROMISE BANNER (Lighter, elegant fresh style to avoid heavy black stacking) */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 my-12 mb-20">
                <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-xl border border-gray-800">
                    <div className="relative z-10">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="h-px bg-gray-700 flex-1 max-w-[80px]"></div>
                            <p className="text-xs font-bold tracking-[0.25em] text-[#0bb799] uppercase">Trusted Worldwide</p>
                            <div className="h-px bg-gray-700 flex-1 max-w-[80px]"></div>
                        </div>
                        
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight mb-8 max-w-3xl mx-auto drop-shadow-md">
                            Join the Revolution in Footwear Care
                        </h2>
                        
                        <a 
                            href="/shop" 
                            className="bg-[#0bb799] text-white px-8 py-3.5 rounded-full font-bold text-sm sm:text-base hover:bg-[#099980] hover:-translate-y-0.5 transition-all shadow-[0_0_20px_rgba(11,183,153,0.35)] hover:shadow-[0_0_30px_rgba(11,183,153,0.55)] inline-block uppercase tracking-wider cursor-pointer"
                        >
                            Shop The Collection
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OurStoryPage
