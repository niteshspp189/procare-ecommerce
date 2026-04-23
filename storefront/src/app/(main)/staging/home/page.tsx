import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellersTabs from "@modules/home/components/best-sellers-tabs"
import CarouselWrapper from "@modules/products/components/related-products/carousel-wrapper"
import StagingProductCard from "@modules/home/components/best-sellers-tabs/staging-product-card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pro Premium Care | Staging Home",
  description: "Experience the ultimate in shoe care and foot comfort.",
}

const s = {
  container: {
    width: '100%',
    backgroundColor: '#fff',
    color: '#000',
    overflowX: 'hidden' as const
  },
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
  const bestSellerHandles = ['shoe-care', 'accessories', 'insoles', 'nails-foot-care']
  const bestSellerCategories = productCategories.filter(c => bestSellerHandles.includes(c.handle || ''))

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
    <div style={s.container} className="animate-fade-in font-sans">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden group min-h-[600px] flex items-center justify-center bg-[#f0f0f8]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing-page-images/hero-banner-v2.png"
            alt="Hero Banner"
            className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105"
          />
        </div>

        <div className="relative z-10 text-center px-4 -mt-32 animate-fade-in-up">
          <h1 className="text-[clamp(32px,6vw,56px)] font-bold text-black leading-tight mb-2 uppercase tracking-wide">
            Clean & Condition Your Shoes
          </h1>
          <p className="text-xl text-gray-800 mb-8 tracking-wide font-medium">
            Wave Bye To Discomfort & Dust
          </p>
          <LocalizedClientLink href="/shop">
            <button className="bg-black text-white px-10 py-3 rounded-full font-semibold text-sm hover:bg-gray-800 transition-all shadow-xl">
              Shop Now
            </button>
          </LocalizedClientLink>
        </div>
      </div>

      <div className="w-full">
        {/* INTRODUCTION */}
        <div className="text-center py-16 animate-fade-in-up">
          <p className="text-gray-500 text-sm mb-2">Extreme Comfort. Hyper Durable. Max Volume.</p>
          <h2 className="text-[clamp(24px,4vw,36px)] font-normal text-black leading-tight max-w-4xl mx-auto">
            Show Care That Brings Comfort And Confidence
          </h2>
        </div>

        {/* CATEGORY GRID V2 - 3 COLUMNS TOUCHING */}
        <div className="flex flex-col md:flex-row w-full animate-fade-in-up h-[500px]">
          <div className="relative group overflow-hidden flex-1 group">
            <img src={imgBase + 'img_008_4096x4096.png'} alt="Insoles & Accessories" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end items-center pb-12 text-white">
              <h3 className="text-2xl font-semibold mb-3">Insoles & Accessories</h3>
              <LocalizedClientLink href="/categories/insoles">
                <button className="bg-white text-black px-6 py-2 rounded-full font-medium text-xs hover:bg-gray-100 transition-colors">Explore</button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden flex-1 group">
            <img src={imgBase + 'img_001_4096x4096.png'} alt="Shoe Care Polish" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end items-center pb-12 text-white">
              <h3 className="text-2xl font-semibold mb-3">Shoe Care Polish</h3>
              <LocalizedClientLink href="/categories/shoe-care">
                <button className="bg-white text-black px-6 py-2 rounded-full font-medium text-xs hover:bg-gray-100 transition-colors">Explore</button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden flex-1 group">
            <img src={imgBase + 'img_005_1024x1024.png'} alt="Nail & Foot Care" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex flex-col justify-end items-center pb-12 text-white">
              <h3 className="text-2xl font-semibold mb-3">Nail & Foot Care</h3>
              <LocalizedClientLink href="/categories/foot-care">
                <button className="bg-white text-black px-6 py-2 rounded-full font-medium text-xs hover:bg-gray-100 transition-colors">Explore</button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        {/* BEST SELLERS TABS SECTION */}
        <div className="py-20 animate-fade-in-up bg-white">
          <div className="text-center mb-0">
            <h2 className="text-4xl font-normal mb-2">Our Best Sellers</h2>
          </div>

          <div className="px-4 max-w-7xl mx-auto">
            <BestSellersTabs
              categories={bestSellerCategories}
              region={region}
              initialProducts={initialProducts}
              isStaging={true}
            />
          </div>
        </div>

        {/* MID BRAND PROMISE BANNER */}
        <div className="bg-[#f0f0f5] py-20 text-center animate-fade-in-up relative overflow-hidden">
          <div className="relative z-10 w-full mx-auto px-4">
            <p className="text-sm font-normal text-gray-500 mb-2">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(24px,3.5vw,48px)] font-normal leading-tight mb-8 whitespace-nowrap overflow-hidden text-ellipsis">Crafting World - Class Care For Every Step</h2>
            <LocalizedClientLink href="/about">
              <button className="bg-[#0bb799] text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-[#099980] transition-colors">Read More About Us</button>
            </LocalizedClientLink>
          </div>
        </div>

        {/* SPLIT SECTION WITH PRODUCT CAROUSEL AND BLACK BOX */}
        <div className="flex flex-col md:flex-row w-full gap-8 py-16 px-4 md:px-8 mx-auto">
          <div className="flex-1 w-full md:w-1/2 overflow-hidden h-full">
            {firstCategoryProducts.length > 0 ? (
              <CarouselWrapper buttonPosition="top-right">
                {firstCategoryProducts.map(product => (
                  <div key={product.id} className="min-w-full sm:min-w-[320px] snap-start shrink-0 h-full">
                    <StagingProductCard product={product} region={region} isFullHeight={true} />
                  </div>
                ))}
              </CarouselWrapper>
            ) : (
              <div className="flex-1 bg-gray-50 rounded-[20px] p-6 h-[420px]">
                <span className="text-gray-400">Loading products...</span>
              </div>
            )}
          </div>
          <div className="flex-1 w-full md:w-1/2 bg-black rounded-2xl min-h-[400px] overflow-hidden">
            <img src={imgBase + 'img_005_1024x1024.png'} alt="Video Placeholder" className="w-full h-full object-cover opacity-80 transition-transform duration-700 hover:scale-105" />
          </div>
        </div>

        {/* FEATURE ICONS ROW */}
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-12 px-4 border-t border-gray-100 mt-8 mb-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 text-gray-700">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <span className="text-sm font-medium text-black">Free Shipping</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 text-gray-700">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <span className="text-sm font-medium text-black">Complete Kit</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 text-gray-700">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-sm font-medium text-black">30 Day Return</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 text-gray-700">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-sm font-medium text-black">Eco Friendly</span>
          </div>
        </div>
      </div>
    </div>
  )
}
