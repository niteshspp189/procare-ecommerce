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

  const isAsc = ["created_at_asc", "price_asc", "title_asc"].includes(sortBy)

  const handleDirectionToggle = () => {
    let nextSort: SortOptions = "created_at_asc"
    if (sortBy === "created_at_asc") nextSort = "created_at"
    else if (sortBy === "created_at") nextSort = "created_at_asc"
    else if (sortBy === "price_asc") nextSort = "price_desc"
    else if (sortBy === "price_desc") nextSort = "price_asc"
    else if (sortBy === "title_asc") nextSort = "title_desc"
    else if (sortBy === "title_desc") nextSort = "title_asc"
    else nextSort = isAsc ? "created_at" : "created_at_asc"

    setQueryParams("sortBy", nextSort)
  }

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <span className="font-bold text-xs small:text-sm text-[#111] uppercase tracking-wider shrink-0">
          Sort by
        </span>
        <button
          onClick={handleDirectionToggle}
          type="button"
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] small:text-xs font-bold rounded-md border border-gray-300 bg-white hover:bg-gray-100 active:scale-95 transition-all text-black shadow-sm cursor-pointer shrink-0"
          title={`Switch order direction to ${isAsc ? "DESC (Descending)" : "ASC (Ascending)"}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isAsc ? "text-emerald-600" : "rotate-180 text-black"}`}
          >
            <path d="M7 20V4M7 4L3 8M7 4L11 8M17 4V20M17 20L21 16M17 20L13 16" />
          </svg>
          <span className="uppercase text-[10px] font-extrabold tracking-tight">
            {isAsc ? "ASC ▲" : "DESC ▼"}
          </span>
        </button>
      </div>

      <FilterRadioGroup
        title=""
        items={sortOptions}
        value={sortBy}
        handleChange={handleChange}
        data-testid={dataTestId}
      />
    </div>
  )
}

export default SortProducts
