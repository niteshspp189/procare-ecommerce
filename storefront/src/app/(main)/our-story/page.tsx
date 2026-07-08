import React from "react"
import CustomVideoPlayer from "./CustomVideoPlayer"

const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const Lightbulb = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"></path>
    <path d="M9 18h6"></path>
    <path d="M10 22h4"></path>
  </svg>
)

const Globe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
)

const Users = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const OurStoryPage = () => {
    return (
        <div className="bg-white">
            {/* HERO SECTION BANNER */}
            <div className="relative h-[360px] overflow-hidden flex items-center justify-center bg-black text-white">
                <div className="absolute inset-0 opacity-45">
                    <img src="/images/our-story-banner-new.jpeg" className="w-full h-full object-cover" alt="Our Story Banner" />
                </div>
                {/* 
                <div className="relative z-10 text-center animate-fade-in-up px-4 max-w-4xl">
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tighter mb-4">Our Story</h1>
                    <p className="text-lg sm:text-2xl font-medium tracking-wide text-gray-200 italic">"Every great journey begins with a single step."</p>
                </div> 
                */}
            </div>

            {/* MAIN STORY TEXT & VIDEO */}
            <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 sm:px-8 text-gray-800 leading-relaxed">
                <div className="flex flex-col lg:flex-row gap-12 items-stretch">
                    {/* VIDEO LEFT */}
                    <div className="w-full lg:w-[55%] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 relative aspect-video bg-gray-50 flex-shrink-0 self-start hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-shadow duration-500">
                        <CustomVideoPlayer videoId="iRgOQn3acBs" />
                    </div>

                    {/* TEXT RIGHT */}
                    <div className="w-full lg:w-[45%] space-y-6 text-base sm:text-lg font-normal text-justify sm:text-left self-center font-['Inter',system-ui,sans-serif] text-gray-600">
                        <p>
                            At <span className="font-semibold text-black">MV Shoecare</span>, our journey began in 2009 with a simple belief: footwear deserves care that matches the craftsmanship behind it.
                        </p>
                        <p>
                            What started as a passion for premium shoe care soon evolved into a mission to bring world-class footwear care solutions to consumers across India and beyond. Our early association with leading international brands helped us understand global standards, advanced formulations, and the science behind preserving footwear. This foundation continues to inspire everything we create today.
                        </p>
                    </div>
                </div>

                {/* ADDITIONAL STORY TEXT (BELOW VIDEO) */}
                <div className="mt-12 lg:mt-16 space-y-6 text-base sm:text-lg font-normal text-justify sm:text-left font-['Inter',system-ui,sans-serif] text-gray-600">
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
                <div className="py-8 my-16 border border-[#0bb799]/30 rounded-xl shadow-sm text-center bg-[#0bb799]/5 relative overflow-hidden">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide text-black px-4 relative z-10">
                        To redefine shoe care through quality, innovation, and ease of use.
                    </p>
                </div>

                {/* VALUES SECTION HEAD */}
                <div className="text-center mb-12">
                    <p className="font-bold text-black uppercase tracking-wider text-base sm:text-lg md:text-xl">
                        As we continue to grow, we remain driven by the same values that shaped our beginnings:
                    </p>
                </div>

                {/* VALUES GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* CARD 1 */}
                    <div className="p-4 pb-6 bg-white border border-gray-100 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative group">
                        <div className="absolute top-8 left-8 z-10 bg-[#0bb799] p-2.5 rounded-full text-white shadow-lg">
                            <CheckCircle />
                        </div>
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 relative">
                            <img src="/images/landing-page-images/img_000_370x480.png" alt="Quality First" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h3 className="font-bold uppercase text-base text-black mb-2 tracking-wide text-center">Quality First</h3>
                        <p className="text-sm text-gray-600 text-center leading-relaxed px-2">Products crafted to deliver professional results you can trust.</p>
                    </div>
                    {/* CARD 2 */}
                    <div className="p-4 pb-6 bg-white border border-gray-100 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative group">
                        <div className="absolute top-8 left-8 z-10 bg-[#0bb799] p-2.5 rounded-full text-white shadow-lg">
                            <Lightbulb />
                        </div>
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 relative">
                            <img src="/images/landing-page-images/img_002_370x480.png" alt="Innovation with Purpose" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h3 className="font-bold uppercase text-base text-black mb-2 tracking-wide text-center">Innovation with Purpose</h3>
                        <p className="text-sm text-gray-600 text-center leading-relaxed px-2">Thoughtfully designed solutions that make shoe care simple and effective.</p>
                    </div>
                    {/* CARD 3 */}
                    <div className="p-4 pb-6 bg-white border border-gray-100 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative group">
                        <div className="absolute top-8 left-8 z-10 bg-[#0bb799] p-2.5 rounded-full text-white shadow-lg">
                            <Globe />
                        </div>
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 relative">
                            <img src="/images/landing-page-images/img_004_370x480.png" alt="Global Expertise" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h3 className="font-bold uppercase text-base text-black mb-2 tracking-wide text-center">Global Expertise, Made in India</h3>
                        <p className="text-sm text-gray-600 text-center leading-relaxed px-2">Combining international know-how with world-class manufacturing in India.</p>
                    </div>
                    {/* CARD 4 */}
                    <div className="p-4 pb-6 bg-white border border-gray-100 rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex flex-col relative group">
                        <div className="absolute top-8 left-8 z-10 bg-[#0bb799] p-2.5 rounded-full text-white shadow-lg">
                            <Users />
                        </div>
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 relative">
                            <img src="/images/landing-page-images/img_009_370x480.png" alt="Care Beyond Products" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <h3 className="font-bold uppercase text-base text-black mb-2 tracking-wide text-center">Care Beyond Products</h3>
                        <p className="text-sm text-gray-600 text-center leading-relaxed px-2">Helping consumers protect, maintain, and enjoy their footwear for longer.</p>
                    </div>
                </div>
            </div>

            {/* BLACK BANNER SECTION */}
            <div className="bg-[#111] text-white my-10 mx-4 sm:mx-8 rounded-[2rem] overflow-hidden flex flex-col lg:flex-row items-stretch shadow-2xl">
                <div className="w-full lg:w-[45%] p-10 lg:p-16 flex flex-col justify-center bg-gradient-to-br from-[#1a1a1a] to-black relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0bb799] to-transparent"></div>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white mb-3 leading-[1.1]">
                        Because<br/>every pair<br/>has a story.
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0bb799]">
                        And we're here to help it last.
                    </p>
                </div>
                <div className="w-full lg:w-[55%] h-[300px] lg:h-auto min-h-[400px] relative">
                    <img src="/images/landing-page-images/img_006_1920x700.png" className="absolute inset-0 w-full h-full object-cover object-left" alt="Procare Products Collage" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-transparent to-transparent hidden lg:block"></div>
                </div>
            </div>

            {/* BRAND PROMISE BANNER */}
            <div className="mb-16 mx-4 sm:mx-8 bg-black rounded-[2rem] p-8 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-30">
                    <img src="/images/landing-page-images/img_010_1920x700.png" className="w-full h-full object-cover" alt="Background" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="h-px bg-gray-600 flex-1 max-w-[100px]"></div>
                        <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-[#0bb799] uppercase">Trusted Worldwide</p>
                        <div className="h-px bg-gray-600 flex-1 max-w-[100px]"></div>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase leading-tight mb-10 max-w-4xl mx-auto drop-shadow-lg">
                        Join the Revolution in Footwear Care
                    </h2>
                    
                    <a href="/shop" className="bg-[#0bb799] text-white px-10 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-[#099980] hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(11,183,153,0.4)] hover:shadow-[0_0_30px_rgba(11,183,153,0.6)] inline-block uppercase tracking-wider">
                        Shop The Collection
                    </a>
                </div>
            </div>
        </div>
    )
}

export default OurStoryPage
