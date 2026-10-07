import { Metadata } from "next"
import { listCollections } from "@lib/data/collections"
import { getRegion, listRegions } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@modules/common/components/product-card"
import Button from "@modules/common/components/button"

export const metadata: Metadata = {
  title: "Collections | Pro Premium Care",
  description: "Explore curated shoe care, foot comfort, and accessory collections from Pro Premium Care.",
}

type Props = {
  params: Promise<{ countryCode?: string }>
}

export default async function CollectionsPage(props: Props) {
  const params = await props.params
  const countryCode = params.countryCode || "in"

  let region = await getRegion(countryCode)
  if (!region) {
    const regions = await listRegions()
    region = regions?.[0]
  }

  const { collections } = await listCollections({ limit: "100" })

  // Fetch products for all active collections
  const collectionsWithProducts = await Promise.all(
    (collections || []).map(async (collection) => {
      if (!region) return { collection, products: [], count: 0 }
      const { response } = await listProducts({
        regionId: region.id,
        queryParams: {
          collection_id: [collection.id],
          limit: 4,
        },
      })
      return {
        collection,
        products: response.products || [],
        count: response.count || 0,
      }
    })
  )

  const activeCollections = collectionsWithProducts.filter((c) => c.products.length > 0)

  return (
    <div className="w-full bg-[#f9f9fb] min-h-screen py-6 sm:py-10 animate-fade-in font-sans">
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 font-medium mb-6 flex items-center gap-2">
          <LocalizedClientLink href="/" className="hover:text-black transition-colors">
            Home
          </LocalizedClientLink>
          <span>/</span>
          <span className="text-gray-900 font-semibold">Collections</span>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-sm mb-8 sm:mb-12">
          <span className="text-xs uppercase font-bold tracking-widest text-[#00bda5] mb-2 block">
            Specialized Lines
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Our Collections
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
            Discover tailored shoe care kits, daily maintenance essentials, and premium foot comfort collections designed for effortless care.
          </p>
        </div>

        {/* Collections List */}
        {activeCollections.length > 0 ? (
          <div className="flex flex-col gap-8 sm:gap-14">
            {activeCollections.map(({ collection, products, count }) => (
              <section
                key={collection.id}
                className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {collection.title}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {count} {count === 1 ? "Product" : "Products"} in this collection
                    </p>
                  </div>
                  <LocalizedClientLink
                    href={`/collections/${collection.handle}`}
                    className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#00bda5] hover:text-[#008f7d] transition-colors"
                  >
                    <span>Explore All ({count})</span>
                    <svg
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </LocalizedClientLink>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      region={region!}
                      variant="featured"
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* Empty State when collections are empty / being curated */
          <div className="bg-white rounded-2xl p-8 sm:p-16 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-[#e6f8f5] text-[#00bda5] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Collections Updating</h3>
            <p className="text-sm text-gray-500 mb-6">
              Our curated product collections are currently being updated. In the meantime, explore our complete catalog of shoe care and comfort products.
            </p>
            <LocalizedClientLink href="/shop">
              <Button variant="primary" className="px-8 py-3">
                Shop All Products
              </Button>
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}
