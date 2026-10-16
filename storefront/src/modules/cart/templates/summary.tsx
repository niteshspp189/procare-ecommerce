"use client"

import { Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { applyPromotions } from "@lib/data/cart"

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
  const [showCelebration, setShowCelebration] = useState(false)
  const [isApplyingFestive, setIsApplyingFestive] = useState(false)

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

  // Festive 5 Auto-Apply Logic (Threshold: ₹999)
  const FESTIVE_MIN_AMOUNT = 999
  const hasFestive5 = cart.promotions?.some((p) => p.code?.toUpperCase() === "FESTIVE5")
  const isFestiveEligible = subtotal >= FESTIVE_MIN_AMOUNT
  const amountToFestive = Math.max(0, FESTIVE_MIN_AMOUNT - subtotal)

  useEffect(() => {
    if (isFestiveEligible && !hasFestive5 && !isApplyingFestive) {
      const autoApply = async () => {
        setIsApplyingFestive(true)
        try {
          const currentCodes = (cart.promotions || [])
            .map((p) => p.code)
            .filter(Boolean) as string[]
          if (!currentCodes.includes("FESTIVE5")) {
            currentCodes.push("FESTIVE5")
            const res = await applyPromotions(currentCodes)
            if (res && !("error" in res)) {
              setShowCelebration(true)
            }
          }
        } catch (e) {
          console.error("Auto apply FESTIVE5 error:", e)
        } finally {
          setIsApplyingFestive(false)
        }
      }
      autoApply()
    }
  }, [isFestiveEligible, hasFestive5, isApplyingFestive, cart.promotions])

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

      {/* Festive 5 Offer Status / Teaser */}
      {hasFestive5 ? (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <div>
              <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Festive Offer Unlocked!
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                5% discount (FESTIVE5) automatically applied.
              </p>
            </div>
          </div>
          <span className="bg-[#d8fa00] text-black font-extrabold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            5% OFF
          </span>
        </div>
      ) : subtotal > 0 && amountToFestive > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🎁</span>
            <p className="text-xs text-amber-900 font-medium">
              Add <span className="font-bold">{convertToLocale({ amount: amountToFestive, currency_code: cart.currency_code })}</span> more to unlock <span className="font-bold uppercase text-amber-950">5% OFF (FESTIVE5)</span>!
            </p>
          </div>
        </div>
      ) : null}

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
        <button className="w-full bg-[#00b5a4] text-white py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-[#009d8e] transition-colors cursor-pointer">
          Checkout →
        </button>
      </LocalizedClientLink>

      <p className="text-xs text-gray-400 text-center">
        Taxes and shipping calculated at checkout
      </p>

      {/* Congratulations Unlock Modal */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-center relative">
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer"
            >
              ✕
            </button>
            <div className="w-16 h-16 mx-auto mb-3 bg-[#d8fa00]/30 rounded-full flex items-center justify-center text-3xl shadow-inner">
              🎉
            </div>
            <Heading level="h3" className="text-xl font-extrabold text-gray-900 mb-1">
              Congratulations!
            </Heading>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              You unlocked our exclusive <span className="font-bold text-gray-900">5% Festive Discount</span> on your order above ₹999!
            </p>
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl py-2 px-4 mb-5 flex items-center justify-center gap-2">
              <span className="text-xs text-gray-500 uppercase font-semibold">Code:</span>
              <span className="font-mono font-extrabold text-sm text-black tracking-wider">FESTIVE5</span>
              <span className="bg-[#d8fa00] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ml-1">
                APPLIED
              </span>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="w-full bg-[#00b5a4] hover:bg-[#009d8e] text-white font-bold py-3 rounded-full text-sm shadow-md transition-colors cursor-pointer"
            >
              Awesome, Claim Discount! →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Summary
