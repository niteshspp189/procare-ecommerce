import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

import { getSeoForPath } from "@lib/util/seo"

const shopSeo = getSeoForPath("/shop")

export const metadata: Metadata = {
  title: shopSeo?.title || "Shop Shoe Care Products & Insoles | PRO Care",
  description:
    shopSeo?.description ||
    "Shop Pro Premium Care's range of shoe cleaners, sneaker wipes, shoe creams, polishes, insoles and foot care tools online.",
  keywords: shopSeo?.keywords
    ? shopSeo.keywords.split(",").map((k) => k.trim())
    : undefined,
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    category?: string
    collection?: string
    size?: string
    color?: string
    type?: string
    q?: string
  }>
  params: Promise<{
    countryCode?: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, category, collection, size, color, type, q } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      category={category}
      collection={collection}
      size={size}
      color={color}
      type={type}
      q={q}
    />
  )
}
