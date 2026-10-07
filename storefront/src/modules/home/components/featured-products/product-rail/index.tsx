import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@modules/common/components/product-card"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts, count },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: [collection.id],
      limit: 4,
    },
  })

  if (!pricedProducts?.length) {
    return null
  }

  return (
    <div className="w-full py-8 sm:py-14 border-t border-gray-100 animate-fade-in">
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#00bda5] mb-1 block">
              Curated Collection
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {collection.title}
            </h2>
          </div>
          <LocalizedClientLink
            href={`/collections/${collection.handle}`}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:text-[#00bda5] transition-colors"
          >
            <span>View All</span>
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
          {pricedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              region={region}
              variant="featured"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

