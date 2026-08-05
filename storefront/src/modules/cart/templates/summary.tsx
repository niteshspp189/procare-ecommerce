"use client"

import { Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

import { useEffect, useState } from "react"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else {
    return "payment"
  }
}

import { trackMetaEvent } from "@lib/util/meta-pixel"

const Summary = ({ cart }: SummaryProps) => {
  const [threshold, setThreshold] = useState(499)

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
    fetch(`${backendUrl}/store/shipping-threshold`, {
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.threshold === "number") {
          setThreshold(data.threshold)
        }
      })
      .catch((err) => console.error("Error fetching shipping threshold:", err))
  }, [])

  const step = getCheckoutStep(cart)
  const effectiveTotal = cart.total ?? 0
  const effectiveShipping = cart.shipping_total ?? cart.shipping_subtotal ?? 0
  const subtotal = effectiveTotal - effectiveShipping
  const amountToFreeShipping = Math.max(0, threshold - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / threshold) * 100)
  const hasFreeShipping = subtotal >= threshold

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>

      {/* Free Shipping Progress */}
      <div className="bg-gray-50 rounded-xl p-4">
        {hasFreeShipping ? (
          <p className="text-sm text-gray-900 font-medium text-center flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Eligible for complimentary shipping
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
            className="h-full bg-[#00b5a4] rounded-full transition-all duration-500"
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
        onClick={() => {
          trackMetaEvent("InitiateCheckout", {
            value: cart.total ?? subtotal ?? 0,
            currency: "INR",
          })
        }}
      >
        <button className="w-full bg-[#00b5a4] text-white py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#009d8e] transition-colors">
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
