import { Suspense } from "react"
import { notFound } from "next/navigation"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

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

import { getRegion } from "@lib/data/regions"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  type,
  size,
  color,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  type?: string
  size?: string
  color?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!collection) {
    notFound()
  }

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { response: { products } } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: [collection.id],
      limit: 100,
    },
  })

  // Log to console locally to verify DB
  console.log(`[CollectionTemplate ${collection.title}] Fetched total initial products:`, products.length)

  const typeOptions = getUniqueFilterOptions(
    products.map((product) => product.type?.value || "").filter(Boolean)
  ).map((value) => ({ value, label: value }))

  const sizeOptions = getProductOptionValues(products, "Size")
  const colorOptions = getProductOptionValues(products, "Color")

  return (
    <div className="flex flex-col lg:flex-row lg:items-start py-4 sm:py-6 content-container gap-6 lg:gap-0">
      <div className="w-full lg:w-[260px] flex-shrink-0">
        <RefinementList
          sortBy={sort}
          types={typeOptions}
          sizes={sizeOptions}
          colors={colorOptions}
          selectedFilters={{ type, size, color }}
        />
      </div>
      <div className="w-full">
        <div className="mb-6 lg:mb-8 text-xl lg:text-2xl-semi">
          <h1>{collection.title}</h1>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length || 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
            typeValue={type}
            sizeValue={size}
            colorValue={color}
          />
        </Suspense>
      </div>
    </div>
  )
}
