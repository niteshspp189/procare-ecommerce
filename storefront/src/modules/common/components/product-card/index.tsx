"use client"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import PreviewPrice from "@modules/products/components/product-preview/price"
import QuickBuy from "@modules/products/components/product-preview/quick-buy"
import { addToCart } from "@lib/data/cart"
import { trackMetaEvent } from "@lib/util/meta-pixel"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import clsx from "clsx"
import { convertToLocale } from "@lib/util/money"

interface ProductCardProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  variant?: "standard" | "featured" | "compact" | "simple"
  isStaging?: boolean
  className?: string
  buttonLabel?: string
}

export default function ProductCard({
  product,
  region,
  variant = "standard",
  isStaging = false,
  className,
  buttonLabel,
}: ProductCardProps) {
  const { cheapestPrice } = getProductPrice({ product })
  const hasDiscount = Boolean(
    cheapestPrice &&
      cheapestPrice.original_price_number &&
      cheapestPrice.calculated_price_number &&
      cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
  )
  const discountPercentage = hasDiscount
    ? Math.round(
        ((cheapestPrice!.original_price_number! - cheapestPrice!.calculated_price_number!) /
          cheapestPrice!.original_price_number!) *
          100
      )
    : 0

  const params = useParams()
  const countryCode = (params?.countryCode as string) || region.countries?.[0]?.iso_2 || "in"
  const [isAdding, setIsAdding] = useState(false)
  const [triggerQuickBuy, setTriggerQuickBuy] = useState(false)
  const { openDrawer } = useCartDrawer()

  const isMultiVariant = product.variants && product.variants.length > 1 && product.options && product.options.length > 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const variantId = product.variants?.[0]?.id
    if (!variantId || isMultiVariant) {
      setTriggerQuickBuy(true)
      return
    }
    setIsAdding(true)
    try {
      await addToCart({ variantId, quantity: 1, countryCode })
      trackMetaEvent("AddToCart", {
        content_name: product.title,
        content_ids: [variantId],
        content_type: "product",
        value: cheapestPrice?.calculated_price_number || 0,
        currency: "INR",
      })
      openDrawer()
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  const heightClass = variant === "standard" ? "h-full flex flex-col justify-between" : "h-full flex flex-col justify-between"
  const paddingClass = variant === "compact" ? "p-4" : "p-3"

  return (
    <div
      className={clsx(
        "group flex flex-col bg-white border border-slate-100 rounded-[20px] transition-all duration-400 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 overflow-hidden",
        heightClass,
        paddingClass,
        className
      )}
    >
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="flex-1 flex flex-col no-underline"
      >
        <div className="relative w-full h-[180px] sm:h-[240px] md:h-[320px] rounded-[16px] overflow-hidden bg-slate-50 mb-3 small:mb-4 transition-colors group-hover:bg-white shrink-0">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={variant === "featured"}
            className="!p-0 object-cover w-full h-full"
          />
          {product.variants && product.variants.length > 0 && (
            <div className="absolute top-0 left-0 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-tl-[16px] rounded-br-[16px] text-[10px] font-bold uppercase tracking-wider text-black shadow-md z-10 border-b border-r border-slate-100/50">
              {product.variants.length > 1 ? "Multi-Variant" : "In Stock"}
            </div>
          )}
          {hasDiscount && discountPercentage > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
              {discountPercentage}% OFF
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 px-1">
          <h3 
            className="text-[13px] small:text-[15px] font-bold text-slate-900 mb-1 leading-tight h-[38px] small:h-[44px] overflow-hidden transition-colors group-hover:text-black"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.title}
          </h3>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-1 h-[20px] overflow-hidden">
            {product.categories?.[0]?.name || "Premium Shine"}
          </p>
          <div className="mt-2 mb-4 h-[30px] flex items-center gap-3">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </LocalizedClientLink>

      <div className="px-1 mt-auto pt-2">
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={clsx(
            "w-full py-2.5 small:py-3 px-1 rounded-full font-bold text-[11px] small:text-[12px] uppercase tracking-tight small:tracking-wider transition-all transform active:scale-95 disabled:opacity-50",
            "bg-[#00bda5] text-white hover:bg-[#00a38f] shadow-md hover:shadow-lg"
          )}
        >
          {isAdding ? "Adding..." : (buttonLabel || (isMultiVariant ? "Select Options" : (isStaging ? "Shop Now" : "Add to Cart")))}
        </button>
      </div>

      <QuickBuy
        product={product}
        region={region}
        externalOpen={triggerQuickBuy}
        onExternalOpenHandled={() => setTriggerQuickBuy(false)}
        hideButton={true}
      />
    </div>
  )
}
