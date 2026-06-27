import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const total = item.total ?? 0
  const unit_price = (item as any).unit_price || (total / (item.quantity || 1))
  const compare_at = (item as any).compare_at_unit_price
  const original_unit_price = (compare_at && compare_at > unit_price)
    ? compare_at
    : ((item.original_total ?? 0) / (item.quantity || 1))
  const hasReducedPrice = unit_price < original_unit_price

  const percentage_diff = Math.round(
    ((original_unit_price - unit_price) / (original_unit_price || 1)) * 100
  )

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <div className="flex items-center gap-1">
          <span
            className="line-through text-xs"
            data-testid="product-unit-original-price"
          >
            {convertToLocale({
              amount: original_unit_price,
              currency_code: currencyCode,
            })}
          </span>
          <span className="text-red-600 font-bold text-xs">-{percentage_diff}%</span>
        </div>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: total / item.quantity,
          currency_code: currencyCode,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice
