import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

type StoreFilterOption = {
  value: string
  label: string
}

const getUniqueFilterOptions = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  )

const getProductOptionValues = (
  products: HttpTypes.StoreProduct[],
  optionTitle: string
): StoreFilterOption[] =>
  getUniqueFilterOptions(
    products.flatMap(
      (product) =>
        product.options
          ?.filter(
            (option) => option.title?.toLowerCase() === optionTitle.toLowerCase()
          )
          .flatMap(
            (option) =>
              option.values
                ?.map((value) => value.value)
                .filter((value) => value && value.toLowerCase() !== "default") ??
              []
          ) ?? []
    )
  ).map((value) => ({
    value,
    label: value,
  }))

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  category,
  collection,
  size,
  color,
  type,
  q,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode?: string
  category?: string
  collection?: string
  size?: string
  color?: string
  type?: string
  q?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const [
    {
      response: { products },
    },
    categories,
    { collections },
  ] = await Promise.all([
    listProducts({
      countryCode,
      queryParams: {
        limit: 100,
      },
    }),
    listCategories(),
    listCollections({
      limit: "100",
    }),
  ])

  const activeProductIds = new Set(products.map((product) => product.id))
  const activeCollectionIds = new Set(
    products.map((product) => product.collection_id).filter(Boolean)
  )

  const categoryOptions: StoreFilterOption[] = categories
    .filter((item) =>
      item.products?.some((product) => activeProductIds.has(product.id))
    )
    .map((item) => ({
      value: item.handle || "",
      label: item.name,
    }))
    .filter((item) => item.value)
    .sort((a, b) => a.label.localeCompare(b.label))

  const collectionOptions: StoreFilterOption[] = collections
    .filter((item) => activeCollectionIds.has(item.id))
    .map((item) => ({
      value: item.handle || "",
      label: item.title,
    }))
    .filter((item) => item.value)
    .sort((a, b) => a.label.localeCompare(b.label))

  const typeOptions: StoreFilterOption[] = getUniqueFilterOptions(
    products.map((product) => product.type?.value || "").filter(Boolean)
  ).map((value) => ({
    value,
    label: value,
  }))

  const sizeOptions = getProductOptionValues(products, "Size")
  const colorOptions = getProductOptionValues(products, "Color")

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        sortBy={sort}
        categories={categoryOptions}
        collections={collectionOptions}
        types={typeOptions}
        sizes={sizeOptions}
        colors={colorOptions}
        selectedFilters={{
          category,
          collection,
          type,
          size,
          color,
        }}
      />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">
            {q ? `Search results for "${q}"` : "All products"}
          </h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            categoryHandle={category}
            collectionHandle={collection}
            typeValue={type}
            sizeValue={size}
            colorValue={color}
            searchQuery={q}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
