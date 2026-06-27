"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"

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
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
      value: string | undefined
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

  const activeCount = [
    selectedFilters?.category && selectedFilters.category !== ALL_VALUE,
    selectedFilters?.collection && selectedFilters.collection !== ALL_VALUE,
    selectedFilters?.size && selectedFilters.size !== ALL_VALUE,
    selectedFilters?.color && selectedFilters.color !== ALL_VALUE,
    selectedFilters?.type && selectedFilters.type !== ALL_VALUE,
    sortBy && sortBy !== "created_at",
  ].filter(Boolean).length

  return (
    <div className="w-full small:w-auto small:min-w-[250px] small:ml-[1.675rem] py-2 small:py-4 mb-4 small:mb-8 px-4 small:px-0">
      {/* Mobile Toggle Button Bar */}
      <div className="small:hidden mb-4">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="w-full flex items-center justify-between py-3.5 px-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[#00bda5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span className="font-bold text-sm text-slate-900 tracking-wide uppercase">
              Filters & Sort
            </span>
            {activeCount > 0 && (
              <span className="bg-[#00bda5] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <span className="text-slate-500 font-bold text-xs">
            {isMobileOpen ? "Close ▲" : "Expand ▼"}
          </span>
        </button>
      </div>

      {/* Filter Sections Container */}
      <div
        className={`flex-col gap-8 ${
          isMobileOpen
            ? "flex bg-slate-50/70 p-5 rounded-2xl border border-slate-100 mb-6"
            : "hidden small:flex"
        }`}
      >
        <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />

        {filterSections.map((section) => (
          <FilterRadioGroup
            key={section.key}
            title={section.title}
            defaultOpen={
              section.key === "category" ||
              section.key === "collection" ||
              (!!section.value && section.value !== ALL_VALUE)
            }
            items={[
              {
                value: ALL_VALUE,
                label: section.allLabel,
              },
              ...(section.items ?? []),
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

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="small:hidden w-full py-3 bg-[#00bda5] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#00a38f] transition-all mt-2"
          >
            Apply Filters {activeCount > 0 && `(${activeCount})`}
          </button>
        )}
      </div>
    </div>
  )
}

export default RefinementList
