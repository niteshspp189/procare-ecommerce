import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellersTabs from "@modules/home/components/best-sellers-tabs"
import CarouselWrapper from "@modules/products/components/related-products/carousel-wrapper"
import StagingProductCard from "@modules/home/components/best-sellers-tabs/staging-product-card"
import Button from "@modules/common/components/button"

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
    <div style={s.container} className="animate-fade-in font-sans">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden group min-h-[600px] flex items-center justify-center bg-[#ffffff]">
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
        {/* INTRODUCTION */}
        <div className="text-center py-16 animate-fade-in-up">
          <p className="text-gray-500 text-sm mb-2">Extreme Comfort. Hyper Durable. Max Volume.</p>
          <h2 className="text-[clamp(24px,4vw,36px)] font-normal text-black leading-tight max-w-4xl mx-auto">
            Show Care That Brings Comfort And Confidence
          </h2>
        </div>

        {/* CATEGORY GRID V2 - RESPONSIVE 4 COLUMNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row w-full animate-fade-in-up">
          <div className="relative group overflow-hidden h-[300px] sm:h-[400px] md:h-[600px] md:flex-1">
            <img 
              src={imgBase + 'img_001_4096x4096.png'} 
              alt="Shoe Care" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wider drop-shadow-lg">Shoe Care</h3>
              <LocalizedClientLink href="/categories/shoe-care">
                <Button variant="primary" className="px-8 py-2.5 shadow-xl">Explore</Button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden h-[300px] sm:h-[400px] md:h-[600px] md:flex-1">
            <img 
              src={imgBase + 'img_008_4096x4096.png'} 
              alt="Insoles" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wider drop-shadow-lg">Insoles</h3>
              <LocalizedClientLink href="/categories/insoles">
                <Button variant="primary" className="px-8 py-2.5 shadow-xl">Explore</Button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden h-[300px] sm:h-[400px] md:h-[600px] md:flex-1">
            <img 
              src={imgBase + 'img_005_1024x1024.png'} 
              alt="Foot Care" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wider drop-shadow-lg">Foot Care</h3>
              <LocalizedClientLink href="/categories/foot-care">
                <Button variant="primary" className="px-8 py-2.5 shadow-xl">Explore</Button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden h-[300px] sm:h-[400px] md:h-[600px] md:flex-1">
            <img 
              src={imgBase + 'img_011_4096x4096.png'} 
              alt="Accessories" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col justify-center items-center text-white px-4 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-4 uppercase tracking-wider drop-shadow-lg">Accessories</h3>
              <LocalizedClientLink href="/categories/accessories">
                <Button variant="primary" className="px-8 py-2.5 shadow-xl">Explore</Button>
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
            <h2 className="text-[clamp(24px,3.5vw,48px)] font-normal leading-tight mb-8">Crafting World - Class Care For Every Step</h2>
            <LocalizedClientLink href="/about">
              <Button variant="primary">Read More About Us</Button>
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
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-14 px-4 border-t border-gray-100 mt-8 mb-16">
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 mb-3 text-gray-800">
              {/* Delivery truck */}
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3"><path strokeLinecap="round" strokeLinejoin="round" d="M1.5 8.5h13v9H1.5V8.5zM14.5 11.5h3l3 3v3h-6v-6z" /><circle cx="5.5" cy="18" r="1.5" /><circle cx="17.5" cy="18" r="1.5" /></svg>
            </div>
            <span className="text-sm font-semibold text-black tracking-wide">Free Delivery</span>
            <span className="text-xs text-gray-400">On all orders above ₹499</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 mb-3 text-gray-800">
              {/* Award / badge */}
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3"><circle cx="12" cy="9" r="6" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.5l-2.5 6L12 18l5.5 2.5L15 14.5" /></svg>
            </div>
            <span className="text-sm font-semibold text-black tracking-wide">Pro-Grade Formula</span>
            <span className="text-xs text-gray-400">Trusted by professionals</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 mb-3 text-gray-800">
              {/* Shield check */}
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 3.5v5c0 4.5-3.2 8.7-8 10-4.8-1.3-8-5.5-8-10v-5L12 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" /></svg>
            </div>
            <span className="text-sm font-semibold text-black tracking-wide">30-Day Guarantee</span>
            <span className="text-xs text-gray-400">Hassle-free returns</span>
          </div>
          <div className="flex flex-col items-center text-center gap-1">
            <div className="w-12 h-12 mb-3 text-gray-800">
              {/* Leaf */}
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 22C6.5 22 3 17.5 3 12c0-4.5 3-8.5 9-10 0 5 2 8 6 9-1 .5-2 .8-3 .8a6 6 0 006-6c1 2 1.5 4 1.5 6.2C22.5 17.5 17.5 22 12 22z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 22V14" /></svg>
            </div>
            <span className="text-sm font-semibold text-black tracking-wide">Eco-Certified</span>
            <span className="text-xs text-gray-400">Safe for you & the planet</span>
          </div>
        </div>
      </div>
    </div>
  )
}
