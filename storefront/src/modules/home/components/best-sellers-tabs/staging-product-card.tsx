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

export default function StagingProductCard({
    product,
    region,
    isFullHeight = false,
}: {
    product: HttpTypes.StoreProduct
    region: HttpTypes.StoreRegion
    isFullHeight?: boolean
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

    const heightClass = isFullHeight ? "h-full min-h-[740px]" : "h-[420px]"

    return (
        <div className={`bg-[#f9f9fb] rounded-[20px] p-6 flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all ${heightClass} relative border border-gray-100/50`}>
            <LocalizedClientLink href={`/products/${product.handle}`} className="flex-1 flex flex-col no-underline relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-white px-3 py-1 text-[11px] font-bold rounded-full shadow-sm z-10 uppercase tracking-widest text-black">New</div>
                <div className={`w-full flex-1 flex justify-center items-center relative z-0 mix-blend-multiply drop-shadow-sm group-hover:scale-110 transition-transform duration-500 py-6 ${isFullHeight ? 'min-h-[420px]' : 'min-h-[200px]'}`}>
                    <Thumbnail thumbnail={product.thumbnail} images={product.images} size="full" className="!bg-transparent !p-0" />
                </div>
                <div className="text-center mt-6">
                    <p className="text-[11px] text-gray-500 mb-2 uppercase tracking-widest">{product.categories?.[0]?.name || "Athletic Support"}</p>
                    <h3 className="font-semibold text-[15px] mb-4 text-black h-12 overflow-hidden line-clamp-2 leading-relaxed">{product.title}</h3>
                </div>
            </LocalizedClientLink>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                <span className="font-extrabold text-black text-[15px] tracking-tight">
                    {cheapestPrice ? <PreviewPrice price={cheapestPrice} /> : "₹1200.00"}
                </span>
                <button onClick={handleAddToCart} className="bg-[#00bda5] text-white px-6 py-2.5 rounded-full text-xs font-bold hover:bg-[#00a38f] transition-colors shadow-sm tracking-wide">Shop Now</button>
            </div>

            <QuickBuy product={product} region={region} externalOpen={triggerQuickBuy} onExternalOpenHandled={() => setTriggerQuickBuy(false)} hideButton={true} />
        </div>
    )
}
