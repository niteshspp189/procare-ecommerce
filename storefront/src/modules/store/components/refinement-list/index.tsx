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
    router.push(query ? `${pathname}?${query}` : pathname)
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
    </div>
  )
}

export default RefinementList
