import { redirect } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"

export const dynamic = "force-dynamic"

export default async function StagingProductDetailIndex(props: {
  params: Promise<{ countryCode?: string }>
}) {
  const params = await props.params
  let countryCode = params.countryCode

  if (!countryCode) {
      const regions = await listRegions()
      countryCode = regions?.[0]?.countries?.[0]?.iso_2 || "in"
  }
  
  const region = await getRegion(countryCode)
  
  if (region) {
    const { response } = await listProducts({
      regionId: region.id,
      queryParams: { handle: 'professional-shoe-care-kit' },
    })
    
    if (response.products.length > 0) {
      redirect(`/staging/product-detail/${response.products[0].handle}`)
    } else {
      const { response: anyResp } = await listProducts({
         regionId: region.id,
         queryParams: { limit: 1 },
      })
      if (anyResp.products.length > 0) {
         redirect(`/staging/product-detail/${anyResp.products[0].handle}`)
      }
    }
  }

  // fallback if none found
  redirect("/")
}