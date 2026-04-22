"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementOption = {
  value: string
  label: string
}

type RefinementListProps = {
  sortBy: SortOptions
  categories?: RefinementOption[]
  collections?: RefinementOption[]
  sizes?: RefinementOption[]
  colors?: RefinementOption[]
  types?: RefinementOption[]
  selectedFilters?: {
    category?: string
    collection?: string
    size?: string
    color?: string
    type?: string
  }
  search?: boolean
  'data-testid'?: string
}

const ALL_VALUE = "__all__"

const RefinementList = ({
  sortBy,
  categories,
  collections,
  sizes,
  colors,
  types,
  selectedFilters,
  'data-testid': dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (!value || value === ALL_VALUE) {
        params.delete(name)
      } else {
        params.set(name, value)
      }

      params.delete("page")

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = buildQueryString(name, value)
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const filterSections = [
    {
      key: "category",
      title: "Category",
      allLabel: "All Categories",
      items: categories,
      value: selectedFilters?.category,
    },
    {
      key: "collection",
      title: "Collection",
      allLabel: "All Collections",
      items: collections,
      value: selectedFilters?.collection,
    },
    {
      key: "type",
      title: "Type",
      allLabel: "All Types",
      items: types,
      value: selectedFilters?.type,
    },
    {
      key: "size",
      title: "Size",
      allLabel: "All Sizes",
      items: sizes,
      value: selectedFilters?.size,
    },
    {
      key: "color",
      title: "Color",
      allLabel: "All Colors",
      items: colors,
      value: selectedFilters?.color,
    },
  ].filter(
    (
      section
    ): section is {
      key: string
      title: string
      allLabel: string
      items: RefinementOption[]
      value?: string
    } => !!section.items?.length
  )

  const hasActiveFilters =
    (selectedFilters?.category && selectedFilters.category !== ALL_VALUE) ||
    (selectedFilters?.collection && selectedFilters.collection !== ALL_VALUE) ||
    (selectedFilters?.size && selectedFilters.size !== ALL_VALUE) ||
    (selectedFilters?.color && selectedFilters.color !== ALL_VALUE) ||
    (selectedFilters?.type && selectedFilters.type !== ALL_VALUE) ||
    (sortBy && sortBy !== "created_at");

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("category")
    params.delete("collection")
    params.delete("size")
    params.delete("color")
    params.delete("type")
    params.delete("page")
    params.delete("sortBy")
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  return (
    <div className="flex small:flex-col gap-12 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />

      {filterSections.map((section) => (
        <FilterRadioGroup
          key={section.key}
          title={section.title}
          items={[
            {
              value: ALL_VALUE,
              label: section.allLabel,
            },
            ...section.items,
          ]}
          value={section.value || ALL_VALUE}
          handleChange={(value: string) => setQueryParams(section.key, value)}
        />
      ))}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-[13px] text-gray-700 hover:text-black flex items-center gap-2 w-fit border border-gray-200 rounded-md px-3 py-2 bg-white shadow-sm hover:shadow hover:bg-gray-50 transition-all font-medium mt-2"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          Clear all filters
        </button>
      )}
    </div>
  )
}

export default RefinementList
