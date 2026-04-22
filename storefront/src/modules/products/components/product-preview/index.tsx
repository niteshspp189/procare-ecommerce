"use client"

import { Text } from "@medusajs/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import QuickBuy from "./quick-buy"
import { addToCart } from "@lib/data/cart"
import { useParams } from "next/navigation"
import { useState } from "react"
import { useCartDrawer } from "@lib/context/cart-drawer-context"

const s = {
  productCard: {
    border: '1px solid #f5f5f5',
    borderRadius: '16px',
    padding: '16px',
    transition: 'all 0.3s',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const
  },
  prodImgWrap: {
    width: '100%',
    aspectRatio: '1/1',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    marginBottom: '16px'
  },
  prodName: { fontSize: '15px', fontWeight: '700', marginBottom: '4px', height: '40px', overflow: 'hidden' },
  prodCat: { fontSize: '13px', color: '#777', marginBottom: '12px' },
  priceRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: 'auto' },
  btnCart: { flex: 1, padding: '10px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' as const },
  btnBuy: { flex: 1, padding: '10px', backgroundColor: '#fff', color: '#000', border: '1px solid #000', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center' as const }
}

export default function ProductPreview({
  product,
  isFeatured,
  region,
  isStaging,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
  isStaging?: boolean
}) {
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
      // Open Quick Buy modal so user can pick variant — cart drawer opens after selection
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

  return (
    <div style={s.productCard as any} className="group hover-lift solid-box animate-fade-in-up">
      <LocalizedClientLink href={`/products/${product.handle}`} className="flex-1 flex flex-col no-underline text-inherit">
        <div style={s.prodImgWrap as any} className="relative group-hover:shadow-inner transition-shadow">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
        </div>
        <div style={s.prodName as any} className="group-hover:text-black transition-colors" data-testid="product-title">
          {product.title}
        </div>
        <div style={s.prodCat as any} className="uppercase tracking-widest font-medium opacity-60">
          {product.categories?.[0]?.name || "Premium Shine"}
        </div>
        <div style={s.priceRow as any} className="mt-1">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </LocalizedClientLink>
      <div style={s.btnRow as any} className="pt-2">
        {isStaging ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              style={{ ...s.btnCart, borderRadius: '999px', backgroundColor: isAdding ? '#099980' : '#0bb799' } as any}
              className="hover:bg-[#099980] transition-all transform active:scale-95 disabled:opacity-60"
            >
              {isAdding ? "Adding…" : "Shop Now"}
            </button>
            <QuickBuy
              product={product}
              region={region}
              externalOpen={triggerQuickBuy}
              onExternalOpenHandled={() => setTriggerQuickBuy(false)}
              hideButton={true}
            />
          </>
        ) : (
          <>
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              style={{ ...s.btnCart, borderRadius: '999px', backgroundColor: isAdding ? '#555' : '#000' } as any}
              className="hover:bg-gray-800 transition-all transform active:scale-95 disabled:opacity-60"
            >
              {isAdding ? "Adding…" : "Add to Cart"}
            </button>
            <QuickBuy
              product={product}
              region={region}
              externalOpen={triggerQuickBuy}
              onExternalOpenHandled={() => setTriggerQuickBuy(false)}
            />
          </>
        )}
      </div>
    </div>
  )
}
