import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellersTabs from "@modules/home/components/best-sellers-tabs"
import FeaturedProducts from "@modules/home/components/featured-products"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Pro Premium Care | Official Store",
  description: "Experience the ultimate in shoe care and foot comfort. Pro Premium Care - Your confidence stays ahead.",
}

const s = {
  container: {
    width: '100%',
    backgroundColor: '#fff',
    color: '#000',
    overflowX: 'hidden' as const
  },
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const region = await getRegion(countryCode)
  const productCategories = await listCategories()
  const { collections } = await listCollections({
    limit: "100"
  })

  // Log categories to help debug
  console.log("All Categories Handles:", productCategories.map(c => c.handle))
  console.log("All Collections Handles:", collections.map(c => c.handle))

  if (!region) {
    const regions = await listRegions()
    const fallbackRegion = regions?.[0]
    if (!fallbackRegion) return null
    return <Home params={Promise.resolve({ countryCode: fallbackRegion.countries?.[0]?.iso_2 || "in" })} />
  }

  // Fetch products for best sellers categories - ordered as per header menu
  const bestSellerHandles = ['shoe-care', 'insoles', 'foot-care', 'accessories']
  const bestSellerCategories = productCategories
    .filter(c => bestSellerHandles.includes(c.handle || ''))
    .sort((a, b) => bestSellerHandles.indexOf(a.handle || '') - bestSellerHandles.indexOf(b.handle || ''))

  console.log("Best Seller Categories found:", bestSellerCategories.map(c => c.handle))

  const initialProducts: Record<string, any[]> = {}
  for (const category of bestSellerCategories) {
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: {
        category_id: [category.id],
        limit: 3
      }
    })
    console.log(`Products in ${category.handle}:`, response.products.length)
    initialProducts[category.id] = response.products
  }

  const imgBase = '/images/landing-page-images/'

  return (
    <div style={s.container} className="animate-fade-in">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden group min-h-[500px] sm:min-h-[600px] flex items-center justify-center bg-[#f7f7f7]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/landing-page-images/hero-banner-v2.png"
            alt="Hero Banner"
            className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-white/20"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-8 animate-fade-in-up">
          <h1 className="text-[clamp(28px,6vw,72px)] font-black text-black leading-tight mb-4 sm:mb-6 uppercase tracking-tighter">
            Clean & Condition Your Shoes
          </h1>
          <p className="text-base sm:text-xl text-gray-800 mb-8 sm:mb-10 tracking-wide font-medium px-4">
            Wave Bye To Discomfort & Dust
          </p>
          <LocalizedClientLink href="/shop">
            <button className="bg-black text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg hover:bg-gray-800 transition-all shadow-xl hover:-translate-y-1">
              Shop Now
            </button>
          </LocalizedClientLink>
        </div>
      </div>

      <div className="pro-container">
        {/* INTRODUCTION */}
        <div className="text-center py-12 sm:py-20 animate-fade-in-up">
          <p className="tracking-[0.2em] text-gray-400 text-xs sm:text-sm font-bold mb-4 uppercase">Extreme Comfort • Hyper Durable • Max Volume</p>
          <h2 className="text-[clamp(20px,4vw,40px)] font-black uppercase leading-tight max-w-4xl mx-auto px-4">
            Show Care That Brings Comfort And Confidence
          </h2>
        </div>

        {/* CATEGORY GRID V2 - 4 COLUMNS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12 sm:mb-24 animate-fade-in-up px-4 sm:px-0">
          <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4]">
            <img src={imgBase + 'img_008_4096x4096.png'} alt="Shoe Care" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Shoe Care</h3>
              <LocalizedClientLink href="/categories/shoe-care">
                <button className="bg-white text-black px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors w-max">Shop Now</button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4]">
            <img src={imgBase + 'img_001_4096x4096.png'} alt="Insoles" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Insoles</h3>
              <LocalizedClientLink href="/categories/insoles">
                <button className="bg-white text-black px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors w-max">Shop Now</button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4]">
            <img src={imgBase + 'img_005_1024x1024.png'} alt="Foot Care" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Foot Care</h3>
              <LocalizedClientLink href="/categories/foot-care">
                <button className="bg-white text-black px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors w-max">Shop Now</button>
              </LocalizedClientLink>
            </div>
          </div>
          <div className="relative group overflow-hidden rounded-xl sm:rounded-2xl aspect-[3/4]">
            <img src={imgBase + 'img_011_4096x4096.png'} alt="Accessories" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col justify-end p-4 sm:p-8 text-white">
              <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Accessories</h3>
              <LocalizedClientLink href="/categories/accessories">
                <button className="bg-white text-black px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-bold text-xs sm:text-sm hover:bg-gray-100 transition-colors w-max">Shop Now</button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>

        {/* BEST SELLERS TABS SECTION */}
        <div className="py-12 sm:py-20 animate-fade-in-up">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-black uppercase mb-4 sm:mb-8">Our Best Sellers</h2>
          </div>

          <BestSellersTabs
            categories={bestSellerCategories}
            region={region}
            initialProducts={initialProducts}
          />
        </div>

        {/* FEATURED COLLECTIONS */}
        <div className="py-12 sm:py-20 animate-fade-in-up border-t border-gray-100">
          <h2 className="text-2xl sm:text-4xl font-black uppercase text-center mb-8 sm:mb-12">Featured Collections</h2>
          {collections && collections.length > 0 ? (
            <ul className="flex flex-col gap-y-0">
              <FeaturedProducts collections={collections} region={region} />
            </ul>
          ) : (
            <div className="text-center py-20 text-gray-500 uppercase tracking-widest text-sm">
              No collections found
            </div>
          )}
        </div>

        {/* BRAND PROMISE BANNER */}
        <div className="my-12 sm:my-24 bg-[#f9f9f9] rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-24 text-center animate-fade-in-up relative overflow-hidden group mx-4 sm:mx-0">
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-gray-400 mb-4 sm:mb-6 uppercase">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(24px,5vw,56px)] font-black uppercase leading-[1.05] mb-8 sm:mb-12">Crafting World - Class Care For Every Step</h2>
            <LocalizedClientLink href="/contact">
              <button className="bg-black text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full font-bold text-sm sm:text-lg hover:bg-gray-800 transition-all shadow-xl">Contact Us</button>
            </LocalizedClientLink>
          </div>
          <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-gray-200 rounded-full blur-3xl opacity-20 -mr-16 sm:-mr-32 -mt-16 sm:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-32 sm:w-64 h-32 sm:h-64 bg-gray-200 rounded-full blur-3xl opacity-20 -ml-16 sm:-ml-32 -mb-16 sm:-mb-32"></div>
        </div>

        {/* FEATURE PILLARS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-12 py-12 sm:py-20 border-t border-gray-100 animate-fade-in-up">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg width="24" height="24" className="sm:w-32 sm:h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <h4 className="font-bold uppercase text-xs sm:text-sm tracking-widest mb-2">Product Quality</h4>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Premium Standard</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg width="24" height="24" className="sm:w-32 sm:h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <h4 className="font-bold uppercase text-xs sm:text-sm tracking-widest mb-2">24/7 Support</h4>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">Always available</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg width="24" height="24" className="sm:w-32 sm:h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polyline points="16 8 20 8 23 11 23 16 16 16" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            </div>
            <h4 className="font-bold uppercase text-xs sm:text-sm tracking-widest mb-2">Free Shipping</h4>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">On all orders</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg width="24" height="24" className="sm:w-32 sm:h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 2v6h6M21.5 22v-6h-6" /><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.3" /></svg>
            </div>
            <h4 className="font-bold uppercase text-xs sm:text-sm tracking-widest mb-2">Easy Returns</h4>
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase">30 Day Policy</p>
          </div>
        </div>
      </div>
    </div>
  )
}
