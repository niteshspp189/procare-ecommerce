import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import StagingProductTemplate from "../staging-template"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Professional Shoe Care Kit | Pro Premium Care",
  description: "A stain & water repellent that performs and is earth friendly",
}

export default async function StagingProductPage(props: {
  params: Promise<{ countryCode?: string; handle: string }>
}) {
  const params = await props.params
  const { handle } = params
  let countryCode = params.countryCode

  if (!countryCode) {
    const regions = await listRegions()
    countryCode = regions?.[0]?.countries?.[0]?.iso_2 || "in"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return notFound()
  }

  // Get a product, maybe 'professional-shoe-care-kit' if exists, otherwise first
  let pricedProduct = await listProducts({
    regionId: region.id,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    pricedProduct = await listProducts({
      regionId: region.id,
      queryParams: { handle: 'professional-shoe-care-kit' },
    }).then(({ response }) => response.products[0])
  }

  if (!pricedProduct) {
    return notFound()
  }

  return (
    <StagingProductTemplate
      product={pricedProduct}
      region={region}
      countryCode={countryCode}
      relatedProducts={
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={pricedProduct} countryCode={countryCode} isStaging={true} />
        </Suspense>
      }
    />
  )
}
