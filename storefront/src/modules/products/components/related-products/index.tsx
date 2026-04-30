import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
  isStaging?: boolean
}

import CarouselWrapper from "./carousel-wrapper"

export default async function RelatedProducts({
  product,
  countryCode,
  isStaging,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {
    limit: 8 // ensure we get enough products for the carousel
  }
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.categories?.length) {
    queryParams.category_id = [product.categories[0].id]
  } else if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  } else if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return response.products.filter(
      (responseProduct) => responseProduct.id !== product.id
    )
  })

  if (!products.length) {
    return null
  }

  const ProductList = () => (
    <>
      {products.map((product) => (
        <li
          key={product.id}
          className={isStaging ? "min-w-[280px] w-[280px] snap-start shrink-0" : ""}
        >
          <Product region={region} product={product} isStaging={isStaging} />
        </li>
      ))}
    </>
  )

  return (
    <div className="product-page-constraint relative">
      {!isStaging && (
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-base-regular text-gray-600 mb-6">
            Related products
          </span>
          <p className="text-2xl-regular text-ui-fg-base max-w-lg">
            You might also want to check out these products.
          </p>
        </div>
      )}

      {isStaging ? (
        <CarouselWrapper>
          <ProductList />
        </CarouselWrapper>
      ) : (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
          <ProductList />
        </ul>
      )}
    </div>
  )
}
