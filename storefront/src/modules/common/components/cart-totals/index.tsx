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
    shipping_total?: number | null
    discount_total?: number | null
    item_total?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    currency_code,
    total,
    shipping_total,
    shipping_subtotal,
    discount_total,
    discount_subtotal,
    item_total,
    item_subtotal,
  } = totals

  // Use tax-inclusive shipping_total if available, else fallback to 80 if threshold applies
  const isBelowThreshold = (item_subtotal ?? 0) < 499
  const effectiveShipping =
    isBelowThreshold && (!shipping_subtotal || shipping_subtotal === 0)
      ? 80
      : shipping_total ?? shipping_subtotal ?? 0
      
  const effectiveTotal =
    isBelowThreshold && (!shipping_subtotal || shipping_subtotal === 0)
      ? (total ?? 0) + 80
      : total ?? 0
      
  const effectiveDiscount = discount_total ?? discount_subtotal ?? 0

  // The Selling Price Subtotal (inc. taxes)
  // Derived from Final Total minus Shipping plus Discount
  const spSubtotal = item_total ?? (effectiveTotal - effectiveShipping + effectiveDiscount)

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-ui-fg-subtle ">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal" data-value={spSubtotal}>
            {convertToLocale({ amount: spSubtotal, currency_code })}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={effectiveShipping}>
            {effectiveShipping === 0
              ? "Free"
              : convertToLocale({ amount: effectiveShipping, currency_code })}
          </span>
        </div>

        {!!effectiveDiscount && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={effectiveDiscount}
            >
              -{" "}
              {convertToLocale({
                amount: effectiveDiscount,
                currency_code,
              })}
            </span>
          </div>
        )}
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="flex items-center justify-between text-ui-fg-base mb-2 txt-medium ">
        <span>Total</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={effectiveTotal}
        >
          {convertToLocale({ amount: effectiveTotal, currency_code })}
        </span>
      </div>
      <div className="h-px w-full border-b border-gray-200 mt-4" />
    </div>
  )
}

export default CartTotals
