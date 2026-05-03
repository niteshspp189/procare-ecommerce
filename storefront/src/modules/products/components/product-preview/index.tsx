import { HttpTypes } from "@medusajs/types"
import ProductCard from "@modules/common/components/product-card"

export default function ProductPreview({
  product,
  isFeatured,
  region,
  isStaging,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  isStaging?: boolean
}) {
  return (
    <ProductCard 
      product={product} 
      region={region} 
      variant={isFeatured ? "featured" : "simple"} 
      isStaging={isStaging}
    />
  )
}
