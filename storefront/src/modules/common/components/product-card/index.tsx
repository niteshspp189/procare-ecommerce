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
import { useState, useMemo } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import clsx from "clsx"
import { convertToLocale } from "@lib/util/money"
import StarRating from "@modules/common/components/star-rating"

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
  const metadata = (product.metadata || {}) as Record<string, any>
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

  const isVariantInStock = (v: any) => {
    if (!v) return false
    if (!v.manage_inventory) return true
    if (v.allow_backorder) return true
    return ((v as any).inventory_quantity || 0) > 0
  }

  const hasStock = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return false
    return product.variants.some((v: any) => isVariantInStock(v))
  }, [product.variants])

  const isOutOfStock = !hasStock

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return

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
        <div className="relative w-full aspect-[4/5] rounded-[16px] overflow-hidden bg-white mb-3 small:mb-4 transition-colors shrink-0">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={variant === "featured"}
            className="!p-0 object-cover w-full h-full"
          />
          <div className="absolute top-0 inset-x-0 p-1.5 small:p-2.5 flex items-start justify-between pointer-events-none z-10 gap-1">
            {product.variants && product.variants.length > 0 && (
              <div
                className={clsx(
                  "pointer-events-auto backdrop-blur-md px-2 py-0.5 small:px-2.5 small:py-1 rounded-md text-[8.5px] small:text-[10px] font-bold uppercase tracking-wide shadow-sm border",
                  isOutOfStock
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-white/95 text-black border-slate-100/50"
                )}
              >
                {isOutOfStock
                  ? "Out of Stock"
                  : product.variants.length > 1
                  ? "Multi-Variant"
                  : "In Stock"}
              </div>
            )}
            {hasDiscount && discountPercentage > 0 && (
              <div className="pointer-events-auto bg-[#d8fa00] text-black text-[9px] small:text-[11px] font-extrabold px-1.5 py-0.5 small:px-2.5 small:py-1 rounded-full uppercase tracking-wider shadow-sm shrink-0 ml-auto">
                {discountPercentage}% OFF
              </div>
            )}
          </div>
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

          <div className="h-[18px] flex items-center">
            {metadata.rating ? (
              <StarRating 
                rating={metadata.rating} 
                count={metadata.review_count || metadata.rating_count} 
                size="sm" 
              />
            ) : null}
          </div>

          <div className="mt-1.5 mb-3 h-[30px] flex items-center gap-3">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </LocalizedClientLink>

      <div className="px-1 mt-auto pt-2">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || isOutOfStock}
          className={clsx(
            "w-full py-2.5 small:py-3 px-1 rounded-full font-bold text-[11px] small:text-[12px] uppercase tracking-tight small:tracking-wider transition-all",
            isOutOfStock
              ? "!bg-gray-200 !text-gray-400 !border-gray-200 !cursor-not-allowed shadow-none hover:!bg-gray-200"
              : "bg-[#00bda5] text-white hover:bg-[#00a38f] shadow-md hover:shadow-lg transform active:scale-95 disabled:opacity-50"
          )}
        >
          {isAdding
            ? "Adding..."
            : isOutOfStock
            ? "Out of Stock"
            : buttonLabel ||
              (isMultiVariant
                ? "Select Options"
                : isStaging
                ? "Shop Now"
                : "Add to Cart")}
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
