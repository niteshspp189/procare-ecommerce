"use client"

import { convertToLocale } from "@lib/util/money"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"

const FREE_SHIPPING_THRESHOLD = 150000

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const { isOpen, openDrawer, closeDrawer } = useCartDrawer()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({})
  const itemRef = useRef<number>(0)
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Sync local quantities when cart prop changes (after router.refresh)
  useEffect(() => {
    if (cartState?.items) {
      const q: Record<string, number> = {}
      cartState.items.forEach((item) => { q[item.id] = item.quantity })
      setLocalQuantities(q)
    }
  }, [cartState])

  const totalItems =
    cartState?.items?.reduce((acc, item) => acc + (localQuantities[item.id] ?? item.quantity), 0) || 0
  const subtotal = cartState?.items?.reduce((acc, item) => {
    const qty = localQuantities[item.id] ?? item.quantity
    const unitPrice = item.unit_price ?? 0
    return acc + unitPrice * qty
  }, 0) ?? 0
  const currencyCode = cartState?.currency_code ?? "inr"
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD

  const pathname = usePathname()

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      openDrawer()
    }
    itemRef.current = totalItems
  }, [totalItems, pathname, openDrawer])

  const changeQuantity = async (lineId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    if (newQty < 1) return
    setLocalQuantities((prev) => ({ ...prev, [lineId]: newQty }))
    setUpdatingId(lineId)
    await updateLineItem({ lineId, quantity: newQty })
      .catch(() => {
        setLocalQuantities((prev) => ({ ...prev, [lineId]: currentQty }))
      })
      .finally(() => {
        setUpdatingId(null)
        startTransition(() => router.refresh())
      })
  }

  return (
    <>
      <button
        onClick={openDrawer}
        className="group flex items-center relative"
        aria-label={`Cart (${totalItems})`}
        data-testid="nav-cart-link"
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 group-hover:bg-gray-100">
          <ShoppingBag size={24} className="transition-transform duration-200 group-hover:scale-105" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold leading-none text-white">
            {totalItems}
          </span>
        </span>
        <span className="sr-only">{`Cart (${totalItems})`}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDrawer} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        data-testid="nav-cart-dropdown"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold tracking-wide">
            Your Cart{" "}
            {totalItems > 0 && (
              <span className="text-gray-400 font-normal text-sm">
                ({totalItems} {totalItems === 1 ? "item" : "items"})
              </span>
            )}
          </h2>
          <button
            onClick={closeDrawer}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {cartState && cartState.items?.length ? (
          <>
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              {hasFreeShipping ? (
                <p className="text-sm text-green-600 font-medium text-center">
                  🎉 You&apos;ve unlocked free shipping!
                </p>
              ) : (
                <p className="text-sm text-gray-600 text-center">
                  Add{" "}
                  <span className="font-semibold text-black">
                    {convertToLocale({ amount: amountToFreeShipping, currency_code: currencyCode })}
                  </span>{" "}
                  more for free shipping
                </p>
              )}
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 no-scrollbar">
              {cartState.items
                .sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))
                .map((item) => {
                  const hasDiscount = item.total < item.original_total
                  return (
                    <div key={item.id} className="flex gap-4" data-testid="cart-item">
                      <LocalizedClientLink
                        href={`/products/${item.product_handle}`}
                        onClick={closeDrawer}
                        className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-50"
                      >
                        <Thumbnail
                          thumbnail={item.thumbnail}
                          images={item.variant?.product?.images}
                          size="square"
                        />
                      </LocalizedClientLink>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <LocalizedClientLink
                              href={`/products/${item.product_handle}`}
                              onClick={closeDrawer}
                              data-testid="product-link"
                              className="text-sm font-medium text-gray-900 hover:underline line-clamp-2"
                            >
                              {item.title}
                            </LocalizedClientLink>
                            <LineItemOptions
                              variant={item.variant}
                              data-testid="cart-item-variant"
                              data-value={item.variant}
                            />
                          </div>
                          <div className="text-right flex-shrink-0">
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through">
                                {convertToLocale({ amount: item.original_total ?? 0, currency_code: currencyCode })}
                              </p>
                            )}
                            <p className={`text-sm font-semibold ${hasDiscount ? "text-red-600" : "text-gray-900"}`}>
                              {convertToLocale({ amount: item.total, currency_code: currencyCode })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                            <button
                              onClick={() => changeQuantity(item.id, localQuantities[item.id] ?? item.quantity, -1)}
                              disabled={(localQuantities[item.id] ?? item.quantity) <= 1 || updatingId === item.id}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {updatingId === item.id ? "…" : (localQuantities[item.id] ?? item.quantity)}
                            </span>
                            <button
                              onClick={() => changeQuantity(item.id, localQuantities[item.id] ?? item.quantity, +1)}
                              disabled={updatingId === item.id}
                              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            data-testid="cart-item-remove-button"
                          >
                            Remove
                          </DeleteButton>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>

            <div className="border-t border-gray-100 px-5 py-5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-base font-medium text-gray-700">Subtotal</span>
                <span className="text-lg font-bold text-gray-900" data-testid="cart-subtotal">
                  {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
                </span>
              </div>
              <p className="text-xs text-gray-400">Taxes and shipping calculated at checkout</p>
              <LocalizedClientLink href="/checkout?step=address" onClick={closeDrawer}>
                <button className="w-full bg-black text-white py-4 rounded-full font-semibold text-sm tracking-wide hover:bg-gray-800 transition-colors">
                  Checkout →
                </button>
              </LocalizedClientLink>
              <LocalizedClientLink href="/cart" onClick={closeDrawer}>
                <button className="w-full border border-gray-200 py-3 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  View Cart
                </button>
              </LocalizedClientLink>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-5 px-5">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Add some products to get started</p>
            </div>
            <LocalizedClientLink href="/shop" onClick={closeDrawer}>
              <button className="bg-black text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors">
                Shop Now
              </button>
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDropdown
