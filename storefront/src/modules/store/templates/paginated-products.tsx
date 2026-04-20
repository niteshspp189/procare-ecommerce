import { listCategories } from "@lib/data/categories"
import { getCollectionByHandle } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

const hasOptionValue = (
  product: HttpTypes.StoreProduct,
  optionTitle: string,
  expectedValue: string
) =>
  product.options?.some(
    (option) =>
      option.title?.toLowerCase() === optionTitle.toLowerCase() &&
      option.values?.some((value) => value.value === expectedValue)
  )

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  collectionHandle,
  categoryHandle,
  typeValue,
  sizeValue,
  colorValue,
  productsIds,
  countryCode,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  collectionHandle?: string
  categoryHandle?: string
  typeValue?: string
  sizeValue?: string
  colorValue?: string
  productsIds?: string[]
  countryCode?: string
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 100,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (!collectionId && collectionHandle) {
    const collection = await getCollectionByHandle(collectionHandle)
    if (collection?.id) {
      queryParams["collection_id"] = [collection.id]
    }
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (!categoryId && categoryHandle) {
    const category = await listCategories({
      handle: categoryHandle,
      limit: 1,
    }).then((categories) => categories[0])

    if (category?.id) {
      queryParams["category_id"] = [category.id]
    }
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products: fetchedProducts },
  } = await listProducts({
    pageParam: 1,
    queryParams,
    countryCode,
  })

  let products = sortProducts(fetchedProducts, sortBy || "created_at")

  if (typeValue) {
    products = products.filter((product) => product.type?.value === typeValue)
  }

  if (sizeValue) {
    products = products.filter((product) =>
      hasOptionValue(product, "Size", sizeValue)
    )
  }

  if (colorValue) {
    products = products.filter((product) =>
      hasOptionValue(product, "Color", colorValue)
    )
  }

  const count = products.length
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const paginatedProducts = products.slice(
    (page - 1) * PRODUCT_LIMIT,
    page * PRODUCT_LIMIT
  )

  return (
    <>
      {paginatedProducts.length ? (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
          data-testid="products-list"
        >
          {paginatedProducts.map((p) => {
            return (
              <li key={p.id}>
                <ProductPreview product={p} region={region} />
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-600">
          No products matched the selected filters.
        </div>
      )}
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
