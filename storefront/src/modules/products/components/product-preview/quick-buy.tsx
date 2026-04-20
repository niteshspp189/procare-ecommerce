"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import Modal from "@modules/common/components/modal"
import { Button, Text, Heading, clx } from "@medusajs/ui"
import { addToCart } from "@lib/data/cart"
import { useParams, useRouter } from "next/navigation"

const s = {
    btnQuick: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#fff',
        color: '#000',
        border: '1.5px solid #000',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        textAlign: 'center' as const,
        transition: 'all 0.2s'
    }
}

export default function QuickBuy({
    product,
    region
}: {
    product: HttpTypes.StoreProduct
    region: HttpTypes.StoreRegion
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        product.variants?.[0]?.id || null
    )
    const [isAdding, setIsAdding] = useState(false)
    const [isBuying, setIsBuying] = useState(false)

    const params = useParams()
    const countryCode = (params?.countryCode as string) || region.countries?.[0]?.iso_2 || "in"
    const router = useRouter()

    const openModal = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
        setIsAdding(false)
        setIsBuying(false)
    }

    const handleAddToCart = async () => {
        if (!selectedVariantId) return
        setIsAdding(true)
        try {
            await addToCart({
                variantId: selectedVariantId,
                quantity: 1,
                countryCode
            })
            // Optionally close modal or show success
            setIsOpen(false)
        } catch (err) {
            console.error(err)
        } finally {
            setIsAdding(false)
        }
    }

    const handleBuyNow = async () => {
        if (!selectedVariantId) return
        setIsBuying(true)
        try {
            await addToCart({
                variantId: selectedVariantId,
                quantity: 1,
                countryCode
            })
            router.push(`/${countryCode}/checkout`)
        } catch (err) {
            console.error(err)
        } finally {
            setIsBuying(false)
        }
    }

    return (
        <>
            <button
                style={s.btnQuick as any}
                onClick={openModal}
                className="hover:bg-gray-50 transition-all transform active:scale-95"
            >
                Quick Buy
            </button>

            <Modal isOpen={isOpen} close={close} size="large">
                <Modal.Title>
                    <Heading className="text-xl font-bold uppercase tracking-widest">{product.title}</Heading>
                </Modal.Title>
                <Modal.Body>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 w-full">
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                            {product.thumbnail && (
                                <img
                                    src={product.thumbnail}
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-y-4">
                            <Text className="text-gray-500 text-sm leading-relaxed">
                                {product.description || "Experience the ultimate care for your footwear with Pro Premium Care. Our products are designed for high-performance protection and maintenance."}
                            </Text>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Text className="font-bold text-base mb-3 uppercase tracking-wider">Select Option</Text>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants?.map((v: any) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariantId(v.id)}
                                            className={clx(
                                                "px-4 py-2 border rounded-full text-xs font-bold transition-all uppercase tracking-widest",
                                                selectedVariantId === v.id
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                                            )}
                                        >
                                            {v.title}
                                        </button>
                                    ))}
                                    {(!product.variants || product.variants.length === 0) && (
                                        <div className="px-4 py-2 border border-black bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
                                            Default
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto pt-6 flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        onClick={handleAddToCart}
                                        isLoading={isAdding}
                                        disabled={!selectedVariantId || isBuying}
                                        className="rounded-full bg-white text-black border-2 border-black hover:bg-gray-50 h-12 uppercase tracking-widest text-xs font-black"
                                    >
                                        Add To Cart
                                    </Button>
                                    <Button
                                        onClick={handleBuyNow}
                                        isLoading={isBuying}
                                        disabled={!selectedVariantId || isAdding}
                                        className="rounded-full bg-black text-white h-12 uppercase tracking-widest text-xs font-black hover:bg-gray-800"
                                    >
                                        Buy Now
                                    </Button>
                                </div>
                                <a
                                    href={`/products/${product.handle}`}
                                    className="w-full text-center py-2 text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest mt-2 underline"
                                >
                                    View Full Details
                                </a>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}
