import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemPriceProps) => {
  const currentPrice = item.total ?? 0
  const originalPrice =
    item.unit_price && item.quantity
      ? item.unit_price * item.quantity
      : (item.original_total ?? currentPrice)
  const hasDiscount = originalPrice > currentPrice && currentPrice > 0

  return (
    <div className="flex flex-col gap-x-2 text-ui-fg-subtle items-end">
      <div className="text-right flex items-center gap-x-1.5">
        {hasDiscount && (
          <span className="line-through text-ui-fg-muted text-xs">
            {convertToLocale({
              amount: originalPrice,
              currency_code: currencyCode,
            })}
          </span>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive font-medium": hasDiscount,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice
