import React from "react"

const OurStoryPage = () => {
    return (
        <div className="bg-white">
            {/* HERO SECTION */}
            <div className="relative h-[60vh] overflow-hidden flex items-center justify-center bg-black text-white">
                <div className="absolute inset-0 opacity-40">
                    <img src="/images/landing-page-images/img_006_1920x700.png" className="w-full h-full object-cover" alt="Our Story" />
                </div>
                <div className="relative z-10 text-center animate-fade-in-up">
                    <h1 className="text-7xl font-black uppercase tracking-tighter">Our Story</h1>
                    <p className="text-xl font-medium tracking-widest mt-4 uppercase">Crafting Excellence Since 1994</p>
                </div>
            </div>

            <div className="py-24 max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                    <div>
                        <h2 className="text-4xl font-black uppercase mb-8 leading-tight">Born from a Passion for <br /> Footwear Perfection</h2>
                        <p className="text-gray-500 leading-relaxed mb-6 uppercase text-sm tracking-tight text-justify">
                            Pro Premium Care was founded with a singular vision: to provide footwear enthusiasts with the tools they need to keep their passion alive. We believe that a well-cared-for pair of shoes is more than just an accessory—it's a statement of confidence.
                        </p>
                        <p className="text-gray-500 leading-relaxed mb-6 uppercase text-sm tracking-tight text-justify">
                            Our journey started in a small workshop with three core principles: quality, sustainability, and transparency. Today, Pro is a global name trusted by professionals and enthusiasts alike.
                        </p>
                    </div>
                    <div className="solid-box overflow-hidden rounded-3xl h-[500px]">
                        <img src="/images/landing-page-images/img_008_4096x4096.png" className="w-full h-full object-cover" alt="Heritage" />
                    </div>
                </div>

                <div className="mt-32 text-center">
                    <h2 className="text-4xl font-black uppercase mb-16 underline underline-offset-8">Our Philosophy</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-8 border-r border-gray-100 last:border-0 text-left">
                            <h3 className="font-bold uppercase text-lg mb-4 underline">Quality</h3>
                            <p className="text-sm text-gray-500 uppercase leading-relaxed tracking-tighter">We source only the finest materials, ensuring every product meets our rigorous standards for performance and longevity.</p>
                        </div>
                        <div className="p-8 border-r border-gray-100 last:border-0 text-left">
                            <h3 className="font-bold uppercase text-lg mb-4 underline">Innovation</h3>
                            <p className="text-sm text-gray-500 uppercase leading-relaxed tracking-tighter">Our labs are constantly developing new formulas and tools to tackle the toughest stains and provide the deepest conditioning.</p>
                        </div>
                        <div className="p-8 text-left">
                            <h3 className="font-bold uppercase text-lg mb-4 underline">Eco-Conscious</h3>
                            <p className="text-sm text-gray-500 uppercase leading-relaxed tracking-tighter">Responsibility is at our core. We strive for 100% recyclable packaging and non-toxic, bio-degradable solutions.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BRAND PROMISE BANNER */}
            <div className="mb-24 mx-4 bg-black rounded-3xl p-12 md:p-24 text-center text-white relative overflow-hidden group">
                <div className="relative z-10">
                    <p className="text-sm font-bold tracking-[0.3em] text-gray-500 mb-6 uppercase">Trusted Worldwide</p>
                    <h2 className="text-[clamp(30px,6vw,56px)] font-black uppercase leading-[1.05] mb-12">Join the Revolution in <br /> Footwear Care</h2>
                    <button className="bg-white text-black px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl">Shop The Collection</button>
                </div>
            </div>
        </div>
    )
}

export default OurStoryPage
