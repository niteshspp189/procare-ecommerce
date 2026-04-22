"use client"

import { Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

const FREE_SHIPPING_THRESHOLD = 150000

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const subtotal = cart.subtotal ?? 0
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>

      {/* Free Shipping Progress */}
      <div className="bg-gray-50 rounded-xl p-4">
        {hasFreeShipping ? (
          <p className="text-sm text-green-600 font-medium text-center">
            🎉 You&apos;ve unlocked free shipping!
          </p>
        ) : (
          <p className="text-sm text-gray-600 text-center">
            Add{" "}
            <span className="font-semibold text-black">
              {convertToLocale({
                amount: amountToFreeShipping,
                currency_code: cart.currency_code,
              })}
            </span>{" "}
            more for free shipping
          </p>
        )}
        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <button className="w-full bg-black text-white py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-gray-800 transition-colors">
          Checkout →
        </button>
      </LocalizedClientLink>

      <p className="text-xs text-gray-400 text-center">
        Taxes and shipping calculated at checkout
      </p>
    </div>
  )
}

export default Summary
