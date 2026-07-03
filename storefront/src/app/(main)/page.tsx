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

export const revalidate = 60


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
        limit: 12
      }
    })
    const prods = [...(response.products || [])]
    if (category.handle === 'shoe-care') {
      const idx = prods.findIndex(p => p.handle === 'pro-gold-color-shoe-cream-with-applicator')
      if (idx > 0) {
        const [item] = prods.splice(idx, 1)
        prods.unshift(item)
      }
    } else if (category.handle === 'insoles') {
      const idx = prods.findIndex(p => p.handle === 'pro-comfort-air-walk-gel-insoles')
      if (idx > 0) {
        const [item] = prods.splice(idx, 1)
        prods.unshift(item)
      }
    }
    initialProducts[category.id] = prods.slice(0, 4)
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
          title="Innovating Shoe Care for Everyday Ease."
          className="py-8 sm:py-12"
          fullWidth={true}
        >
          <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5 w-full animate-fade-in-up mt-6">
            {/* Shoe Care */}
            <div className="flex flex-col group">
              <LocalizedClientLink href="/categories/shoe-care" className="block overflow-hidden rounded-[6px] bg-gray-100 aspect-[9/10] shadow-md group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={imgBase + 'cat-shoecare-new.webp'} 
                  alt="Shoe Care" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </LocalizedClientLink>
              <div className="mt-5 flex flex-col items-center text-center">
                <LocalizedClientLink href="/categories/shoe-care">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide uppercase group-hover:text-[#0bb799] transition-colors">Shoe Care</h3>
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/shoe-care">
                  <Button variant="secondary" className="!border-black !border !text-black !bg-transparent px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm group-hover:shadow transition-all hover:!bg-black hover:!text-white">Explore</Button>
                </LocalizedClientLink>
              </div>
            </div>

            {/* Insoles */}
            <div className="flex flex-col group">
              <LocalizedClientLink href="/categories/insoles" className="block overflow-hidden rounded-[6px] bg-gray-100 aspect-[9/10] shadow-md group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={imgBase + 'cat-insoles-new.webp'} 
                  alt="Insoles" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </LocalizedClientLink>
              <div className="mt-5 flex flex-col items-center text-center">
                <LocalizedClientLink href="/categories/insoles">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide uppercase group-hover:text-[#0bb799] transition-colors">Insoles</h3>
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/insoles">
                  <Button variant="secondary" className="!border-black !border !text-black !bg-transparent px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm group-hover:shadow transition-all hover:!bg-black hover:!text-white">Explore</Button>
                </LocalizedClientLink>
              </div>
            </div>

            {/* Foot Care */}
            <div className="flex flex-col group">
              <LocalizedClientLink href="/categories/foot-care" className="block overflow-hidden rounded-[6px] bg-gray-100 aspect-[9/10] shadow-md group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={imgBase + 'cat-footcare-new.webp'} 
                  alt="Foot Care" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </LocalizedClientLink>
              <div className="mt-5 flex flex-col items-center text-center">
                <LocalizedClientLink href="/categories/foot-care">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide uppercase group-hover:text-[#0bb799] transition-colors">Foot Care</h3>
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/foot-care">
                  <Button variant="secondary" className="!border-black !border !text-black !bg-transparent px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm group-hover:shadow transition-all hover:!bg-black hover:!text-white">Explore</Button>
                </LocalizedClientLink>
              </div>
            </div>

            {/* Accessories */}
            <div className="flex flex-col group">
              <LocalizedClientLink href="/categories/accessories" className="block overflow-hidden rounded-[6px] bg-gray-100 aspect-[9/10] shadow-md group-hover:shadow-xl transition-all duration-500">
                <img 
                  src={imgBase + 'cat-accessories-new.webp'} 
                  alt="Accessories" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
              </LocalizedClientLink>
              <div className="mt-5 flex flex-col items-center text-center">
                <LocalizedClientLink href="/categories/accessories">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide uppercase group-hover:text-[#0bb799] transition-colors">Accessories</h3>
                </LocalizedClientLink>
                <LocalizedClientLink href="/categories/accessories">
                  <Button variant="secondary" className="!border-black !border !text-black !bg-transparent px-8 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-sm group-hover:shadow transition-all hover:!bg-black hover:!text-white">Explore</Button>
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </Section>

        {/* BEST SELLERS SECTION */}
        <Section 
          title="Our Best Sellers" 
          className="bg-slate-50/50"
          innerClassName="!py-4"
        >
          <BestSellersTabs
            categories={bestSellerCategories}
            region={region}
            initialProducts={initialProducts}
            isStaging={true}
          />
        </Section>

        {/* BRAND PROMISE BANNER */}
        <Section className="bg-[#f0f0f5]" innerClassName="!py-8">
          <div className="text-center">
            <p className="text-sm font-normal text-gray-500 mb-2 uppercase tracking-[0.2em]">European Expertise. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(28px,5vw,56px)] font-normal leading-tight mb-10 max-w-5xl mx-auto">Crafting World-Class Care For Every Step</h2>
            <LocalizedClientLink href="/about">
              <Button variant="primary" className="px-10">Read More About Us</Button>
            </LocalizedClientLink>
          </div>
        </Section>

        {/* PRODUCT CAROUSEL & MEDIA SECTION */}
        <Section innerClassName="!pt-2 !pb-6">
          <div className="flex flex-col lg:flex-row w-full gap-12 items-center">
            <div className="flex-1 w-full lg:w-1/2 overflow-hidden h-full">
              {firstCategoryProducts.length > 0 ? (
                <CarouselWrapper buttonPosition="top-right">
                  {firstCategoryProducts.map(product => (
                    <div key={product.id} className="w-full sm:w-[440px] snap-start shrink-0 p-2">
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

        {/* CUSTOMER REVIEWS CAROUSEL */}
        <Section title="What Our Customers Say" className="bg-white overflow-hidden" innerClassName="!pt-12 !pb-12">
          <div className="w-full relative max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
            <CarouselWrapper>
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="snap-center shrink-0 w-[85vw] sm:w-[60vw] md:w-[45vw] lg:w-[35vw] flex items-center justify-center p-2">
                  <img 
                    src={`/images/landing-page-images/review-${num}.png`} 
                    alt={`Customer Review ${num}`} 
                    className="w-full h-auto rounded-[16px] shadow-lg border border-gray-100 object-contain"
                  />
                </div>
              ))}
            </CarouselWrapper>
          </div>
        </Section>

        {/* FEATURE ICONS ROW */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 py-2 px-6 border-t border-gray-100">
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
              <span className="text-base font-bold text-black tracking-widest uppercase">Trusted Worldwide</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trusted by professionals</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-black tracking-widest uppercase">ISO Compliance</span>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ISO 9001:2015 Certified</span>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 text-[#00bda5] bg-slate-50 p-5 rounded-[24px] shadow-sm transition-transform hover:scale-110">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.5 22 3 17.5 3 12c0-4.5 3-8.5 9-10 0 5 2 8 6 9-1 .5-2 .8-3 .8a6 6 0 006-6c1 2 1.5 4 1.5 6.2C22.5 17.5 17.5 22 12 22z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22V14" />
              </svg>
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
