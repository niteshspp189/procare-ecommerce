"use client"

import { Text } from "@medusajs/ui"
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

const s = {
    card: {
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '12px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        border: '1px solid #f1f5f9',
    },
    imageWrapper: {
        width: '100%',
        aspectRatio: '1/1',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: '16px',
        position: 'relative' as const,
    },
    content: {
        display: 'flex',
        flexDirection: 'column' as const,
        flex: 1,
    },
    title: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: '4px',
        lineHeight: '1.4',
        height: '42px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    },
    category: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        marginBottom: '12px',
    },
    price: {
        marginTop: 'auto',
        marginBottom: '16px',
    },
    actions: {
        display: 'flex',
        gap: '8px',
    },
    button: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        transition: 'all 0.2s',
        cursor: 'pointer',
        border: 'none',
    }
}

export default function ProductItemCard({
    product,
    region,
    isStaging = false,
    isFeatured = false,
}: {
    product: HttpTypes.StoreProduct
    region: HttpTypes.StoreRegion
    isStaging?: boolean
    isFeatured?: boolean
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

    return (
        <div
            style={s.card as any}
            className="group hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
        >
            <LocalizedClientLink href={`/products/${product.handle}`} className="flex-1 flex flex-col no-underline">
                <div style={s.imageWrapper as any} className="bg-slate-50 group-hover:bg-white transition-colors">
                    <Thumbnail
                        thumbnail={product.thumbnail}
                        images={product.images}
                        size="full"
                        isFeatured={isFeatured}
                        className="!p-0"
                    />
                </div>

                <div style={s.content as any}>
                    <div style={s.title as any} className="group-hover:text-black transition-colors">
                        {product.title}
                    </div>
                    <div style={s.category as any}>
                        {product.categories?.[0]?.name || "Premium Shine"}
                    </div>
                    <div style={s.price as any}>
                        {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
                    </div>
                </div>
            </LocalizedClientLink>

            <div style={s.actions as any}>
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="w-full bg-black text-white hover:bg-slate-800 transition-all transform active:scale-95 disabled:opacity-50"
                    style={s.button as any}
                >
                    {isAdding ? "Adding..." : (isStaging ? "Shop Now" : "Add to Cart")}
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
