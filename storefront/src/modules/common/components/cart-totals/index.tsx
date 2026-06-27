"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const items = (totals as any).items || []
  const totalMrpSavings = items.reduce((acc: number, item: any) => {
    const compareAt = item.compare_at_unit_price
    const unitPrice = item.unit_price || ((item.total || 0) / (item.quantity || 1))
    if (compareAt && compareAt > unitPrice) {
      return acc + (compareAt - unitPrice) * item.quantity
    }
    return acc
  }, 0)

  const calculatedTax =
    tax_total || (total ? Math.round(total - total / 1.18) : 0)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        {totalMrpSavings > 0 && !discount_subtotal && (
          <>
            <div className="flex items-center justify-between">
              <span>Total MRP</span>
              <span className="line-through text-gray-400">
                {convertToLocale({
                  amount: (item_subtotal ?? 0) + totalMrpSavings,
                  currency_code,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>MRP Discount</span>
              <span className="text-emerald-600 font-semibold">
                -{" "}
                {convertToLocale({
                  amount: totalMrpSavings,
                  currency_code,
                })}
              </span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <span>Subtotal (incl. taxes)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({ amount: item_subtotal ?? 0, currency_code })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({ amount: shipping_subtotal ?? 0, currency_code })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center text-ui-fg-base font-medium">
            Taxes (18% GST inclusive)
          </span>
          <span data-testid="cart-taxes" data-value={calculatedTax || 0}>
            {convertToLocale({ amount: calculatedTax ?? 0, currency_code })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
