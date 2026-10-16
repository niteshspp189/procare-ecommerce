import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ category: string[]; countryCode?: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: any) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

import { getSeoForCategory } from "@lib/util/seo"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category)

    if (!productCategory) {
      return {
        title: "Category | ProCare",
      }
    }

    const catHandle = params.category[params.category.length - 1]
    const customSeo = getSeoForCategory(catHandle)

    const title = customSeo?.title || `${productCategory.name} | ProCare`
    const description = customSeo?.description || productCategory.description || `${title} category.`
    const keywords = customSeo?.keywords
      ? customSeo.keywords.split(",").map((k) => k.trim())
      : undefined

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: `${params.category.join("/")}`,
      },
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    }
  } catch (error) {
    return {
      title: "Category | ProCare",
    }
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params

  // Extract all available filters exactly like the Shop page
  const { sortBy, page, collection, size, color, type } = searchParams as any

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode || "in"}
      collection={collection}
      size={size}
      color={color}
      type={type}
    />
  )
}
