"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions =
  | "created_at"
  | "created_at_asc"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc"

type SortProductsProps = {
  sortBy?: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Latest Arrivals (Newest → Oldest)",
  },
  {
    value: "created_at_asc",
    label: "Oldest Arrivals (Oldest → Newest)",
  },
  {
    value: "price_asc",
    label: "Price: Low → High",
  },
  {
    value: "price_desc",
    label: "Price: High → Low",
  },
  {
    value: "title_asc",
    label: "Name: A → Z",
  },
  {
    value: "title_desc",
    label: "Name: Z → A",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy = "created_at_asc",
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: SortOptions) => {
    setQueryParams("sortBy", value)
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <FilterRadioGroup
        title="Sort Options"
        items={sortOptions}
        value={sortBy}
        handleChange={handleChange}
        data-testid={dataTestId}
      />
    </div>
  )
}

export default SortProducts
