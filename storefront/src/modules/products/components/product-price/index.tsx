import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const hasDiscount = Boolean(
    selectedPrice.original_price_number &&
      selectedPrice.calculated_price_number &&
      selectedPrice.original_price_number > selectedPrice.calculated_price_number
  )

  return (
    <div className="flex items-baseline gap-3 text-ui-fg-base">
      <span className="text-2xl font-bold text-black">
        {!variant && "From "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {hasDiscount && (
        <>
          <span
            className="line-through text-lg text-slate-400 font-medium"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {Math.round(
              ((selectedPrice.original_price_number! -
                selectedPrice.calculated_price_number!) /
                selectedPrice.original_price_number!) *
                100
            )}% OFF
          </span>
        </>
      )}
    </div>
  )
}
