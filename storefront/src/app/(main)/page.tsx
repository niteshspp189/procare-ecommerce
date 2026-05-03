import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellersTabs from "@modules/home/components/best-sellers-tabs"
import CarouselWrapper from "@modules/products/components/related-products/carousel-wrapper"
import ProductCard from "@modules/common/components/product-card"
import Button from "@modules/common/components/button"
import Section from "@modules/layout/components/section"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pro Premium Care | Staging Home",
  description: "Experience the ultimate in shoe care and foot comfort.",
}

export default async function StagingHome(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const region = await getRegion(countryCode)
  const productCategories = await listCategories()
  const { collections } = await listCollections({
    limit: "100"
  })

  if (!region) {
    const regions = await listRegions()
    const fallbackRegion = regions?.[0]
    if (!fallbackRegion) return null
    return <StagingHome params={Promise.resolve({ countryCode: fallbackRegion.countries?.[0]?.iso_2 || "in" })} />
  }

  // Fetch products for best sellers categories
  const bestSellerHandles = ['shoe-care', 'insoles', 'foot-care', 'accessories']
  const bestSellerCategories = bestSellerHandles
    .map(handle => {
      const category = productCategories.find(c => c.handle === handle)
      if (category && category.handle === 'shoe-care') {
        return { ...category, name: 'Shoe Care' }
      }
      return category
    })
    .filter(Boolean) as any[]

  const initialProducts: Record<string, any[]> = {}
  for (const category of bestSellerCategories) {
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: {
        category_id: [category.id],
        limit: 4
      }
    })
    initialProducts[category.id] = response.products
  }

  const imgBase = '/images/landing-page-images/'
  const firstCategoryProducts = bestSellerCategories.length > 0 ? initialProducts[bestSellerCategories[0].id] || [] : []

  return (
    <div className="animate-fade-in font-sans bg-white overflow-x-hidden w-full">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden group min-h-[600px] flex items-center justify-center bg-white">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing-page-images/hero-banner-v5.png"
            alt="Hero Banner"
            className="w-full h-full object-cover object-bottom transition-transform duration-[5s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.8)_0%,_transparent_70%)] z-0" />
        </div>

        <div className="relative z-10 text-center px-4 -mt-24 animate-fade-in-up">
          <h1 className="text-[clamp(32px,6vw,64px)] font-bold text-black leading-tight mb-4 uppercase tracking-tighter">
            Clean & Condition Your Shoes
          </h1>
          <p className="text-[clamp(16px,2vw,22px)] text-black mb-10 tracking-wide font-semibold opacity-90">
            Wave Bye To Discomfort & Dust
          </p>
          <LocalizedClientLink href="/shop">
            <Button variant="primary" className="px-12 py-4">
              Shop Now
            </Button>
          </LocalizedClientLink>
        </div>
      </div>

      <div className="w-full">
        {/* INTRODUCTION & CATEGORY GRID */}
        <Section 
          subtitle="Extreme Comfort. Hyper Durable. Max Volume."
          title="Show Care That Brings Comfort And Confidence"
          className="pb-0"
          fullWidth={true}
        >
          <div className="flex flex-col md:flex-row w-full animate-fade-in-up border-y border-slate-100">
            <div className="relative group overflow-hidden h-[400px] sm:h-[500px] md:h-[650px] md:flex-1 border-r border-slate-100">
              <img 
                src={imgBase + 'img_001_4096x4096.png'} 
                alt="Shoe Care" 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider drop-shadow-2xl">Shoe Care</h3>
                  <LocalizedClientLink href="/categories/shoe-care">
                    <Button variant="primary" className="px-10 py-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">Explore</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
            <div className="relative group overflow-hidden h-[400px] sm:h-[500px] md:h-[650px] md:flex-1 border-r border-slate-100">
              <img 
                src={imgBase + 'img_008_4096x4096.png'} 
                alt="Insoles" 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider drop-shadow-2xl">Insoles</h3>
                  <LocalizedClientLink href="/categories/insoles">
                    <Button variant="primary" className="px-10 py-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">Explore</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
            <div className="relative group overflow-hidden h-[400px] sm:h-[500px] md:h-[650px] md:flex-1 border-r border-slate-100">
              <img 
                src={imgBase + 'img_005_1024x1024.png'} 
                alt="Foot Care" 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider drop-shadow-2xl">Foot Care</h3>
                  <LocalizedClientLink href="/categories/foot-care">
                    <Button variant="primary" className="px-10 py-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">Explore</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
            <div className="relative group overflow-hidden h-[400px] sm:h-[500px] md:h-[650px] md:flex-1">
              <img 
                src={imgBase + 'img_011_4096x4096.png'} 
                alt="Accessories" 
                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="text-3xl md:text-4xl font-bold mb-4 uppercase tracking-wider drop-shadow-2xl">Accessories</h3>
                  <LocalizedClientLink href="/categories/accessories">
                    <Button variant="primary" className="px-10 py-3 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">Explore</Button>
                  </LocalizedClientLink>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* BEST SELLERS SECTION */}
        <Section 
          title="Our Best Sellers" 
          className="bg-slate-50/50"
          innerClassName="!py-24"
        >
          <BestSellersTabs
            categories={bestSellerCategories}
            region={region}
            initialProducts={initialProducts}
            isStaging={true}
          />
        </Section>

        {/* BRAND PROMISE BANNER */}
        <Section className="bg-[#f0f0f5]">
          <div className="text-center">
            <p className="text-sm font-normal text-gray-500 mb-2 uppercase tracking-[0.2em]">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(28px,5vw,56px)] font-normal leading-tight mb-10 max-w-5xl mx-auto">Crafting World-Class Care For Every Step</h2>
            <LocalizedClientLink href="/about">
              <Button variant="primary" className="px-10">Read More About Us</Button>
            </LocalizedClientLink>
          </div>
        </Section>

        {/* PRODUCT CAROUSEL & MEDIA SECTION */}
        <Section>
          <div className="flex flex-col lg:flex-row w-full gap-12 items-center">
            <div className="flex-1 w-full lg:w-1/2 overflow-hidden h-full">
              {firstCategoryProducts.length > 0 ? (
                <CarouselWrapper buttonPosition="top-right">
                  {firstCategoryProducts.map(product => (
                    <div key={product.id} className="min-w-full sm:min-w-[340px] snap-start shrink-0 p-2">
                      <ProductCard product={product} region={region} />
                    </div>
                  ))}
                </CarouselWrapper>
              ) : (
                <div className="flex-1 bg-gray-50 rounded-[24px] p-6 h-[520px] flex items-center justify-center">
                  <span className="text-gray-400">Loading premium products...</span>
                </div>
              )}
            </div>
            <div className="flex-1 w-full lg:w-1/2 bg-black rounded-[32px] h-[520px] overflow-hidden group shadow-2xl relative">
              <img 
                src={imgBase + 'img_005_1024x1024.png'} 
                alt="Product Focus" 
                className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 </div>
              </div>
            </div>
          </div>
        </Section>

        {/* FEATURE ICONS ROW */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 py-24 px-6 border-t border-gray-100">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M1.5 8.5h13v9H1.5V8.5zM14.5 11.5h3l3 3v3h-6v-6z" /><circle cx="5.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-black tracking-widest uppercase">Free Delivery</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">On all orders above ₹499</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="9" r="6" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5l-2.5 6L12 18l5.5 2.5L15 14.5" /></svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-black tracking-widest uppercase">Pro-Grade Formula</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trusted by professionals</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 3.5v5c0 4.5-3.2 8.7-8 10-4.8-1.3-8-5.5-8-10v-5L12 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-black tracking-widest uppercase">30-Day Guarantee</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hassle-free returns</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.5 22 3 17.5 3 12c0-4.5 3-8.5 9-10 0 5 2 8 6 9-1 .5-2 .8-3 .8a6 6 0 006-6c1 2 1.5 4 1.5 6.2C22.5 17.5 17.5 22 12 22z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V14" /></svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-black tracking-widest uppercase">Eco-Certified</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Safe for you & the planet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
