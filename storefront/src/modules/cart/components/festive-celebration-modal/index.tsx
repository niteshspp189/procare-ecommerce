"use client"

import { Heading } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useState, useRef } from "react"

export default function FestiveCelebrationModal({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasTriggeredRef = useRef(false)

  const hasFestive5 = Boolean(
    cart?.promotions?.some((p) => p.code?.toUpperCase() === "FESTIVE5")
  )

  useEffect(() => {
    if (!cart?.id || !hasFestive5) {
      setIsOpen(false)
      return
    }

    try {
      const isClaimed =
        typeof window !== "undefined" &&
        sessionStorage.getItem(`festive5_claimed_${cart.id}`) === "true"

      if (!isClaimed && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true
        setIsOpen(true)
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }, [cart?.id, hasFestive5])

  const dismiss = () => {
    setIsOpen(false)
    hasTriggeredRef.current = true
    try {
      if (typeof window !== "undefined" && cart?.id) {
        sessionStorage.setItem(`festive5_claimed_${cart.id}`, "true")
      }
    } catch {
      // Ignore storage errors
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
      onClick={dismiss}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-center relative pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
          aria-label="Close celebration modal"
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
          <span className="bg-[#d8fa00] text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ml-1 shadow-xs">
            APPLIED
          </span>
        </div>

        <button
          onClick={dismiss}
          className="w-full bg-[#00b5a4] hover:bg-[#009d8e] text-white font-bold py-3 rounded-full text-sm shadow-md transition-colors cursor-pointer active:scale-95 transform"
        >
          Awesome, Claim Discount! →
        </button>
      </div>
    </div>
  )
}
