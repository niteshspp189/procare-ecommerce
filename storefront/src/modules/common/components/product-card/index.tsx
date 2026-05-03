"use client"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import PreviewPrice from "@modules/products/components/product-preview/price"
import QuickBuy from "@modules/products/components/product-preview/quick-buy"
import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import clsx from "clsx"

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
      openDrawer()
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  const heightClass = variant === "standard" ? "h-[580px]" : "h-full"
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
        <div className="relative w-full h-[320px] rounded-[16px] overflow-hidden bg-slate-50 mb-4 transition-colors group-hover:bg-white shrink-0">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={variant === "featured"}
            className="!p-0 object-cover w-full h-full"
          />
          {product.variants && product.variants.length > 0 && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-black shadow-sm z-10">
              {product.variants.length > 1 ? "Multi-Variant" : "In Stock"}
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 px-1">
          <h3 
            className="text-[15px] font-bold text-slate-900 mb-1 leading-tight h-[44px] overflow-hidden transition-colors group-hover:text-black"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.title}
          </h3>
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-2 h-[20px] overflow-hidden">
            {product.categories?.[0]?.name || "Premium Shine"}
          </p>
          <div className="mt-auto mb-4 h-[30px] flex items-center">
            {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
          </div>
        </div>
      </LocalizedClientLink>

      <div className="px-1">
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={clsx(
            "w-full py-3 rounded-full font-bold text-[12px] uppercase tracking-wider transition-all transform active:scale-95 disabled:opacity-50",
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
