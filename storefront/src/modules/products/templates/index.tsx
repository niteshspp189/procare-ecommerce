"use client"

import React, { Suspense, useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { addToCart } from "@lib/data/cart"
import ProductPrice from "@modules/products/components/product-price"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import Button from "@modules/common/components/button"

const s = {
  container: { width: '100%', backgroundColor: '#f9f9fb', color: '#000', paddingBottom: '80px' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 24px' },
  breadcrumb: { padding: '20px 0', fontSize: '12px', color: '#888' },
  howSection: { backgroundColor: '#fff', color: '#000', padding: '80px 0' },
  btnBuy: { flex: 1, padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' as const },
  btnCart: { flex: 1, padding: '14px', backgroundColor: '#f3f4f6', color: '#000', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' as const },
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  relatedProducts?: React.ReactNode
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const StagingProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  relatedProducts,
}) => {
  const images = useMemo(() => {
    if (product?.images?.length) return product.images
    if (product?.thumbnail) return [{ id: 'thumbnail', url: product.thumbnail } as HttpTypes.StoreProductImage]
    return []
  }, [product])
  const imgBase = '/images/product-detail-images/'
  const { openDrawer } = useCartDrawer()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})

  // If there is only 1 variant, preselect the options
  React.useEffect(() => {
    if (product?.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product?.variants])

  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product?.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  // Dynamic details
  const title = product?.title || "Professional Shoe Care Kit"
  const breadcrumbName = product?.title || "PRO Sport Performance Insole"
  const subtitle = product?.subtitle || product?.description?.slice(0, 100) || "A stain & water repellent that performs and is earth friendly"

  const handleAddToCart = async () => {
    setIsAdding(true)
    const variantId = selectedVariant?.id || product?.variants?.[0]?.id
    if (variantId) {
      try {
        await addToCart({ variantId, quantity, countryCode })
        openDrawer()
      } catch (err) {
        console.error(err)
      }
    }
    setIsAdding(false)
  }

  const [activeAccordion, setActiveAccordion] = useState<string | null>("description")

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name)
  }

  const metadata = product?.metadata || {}

  return (
    <div style={s.container as any} className="font-sans">
      <div style={s.inner as any}>
        <div style={s.breadcrumb as any}>
          <LocalizedClientLink href="/" className="hover:text-black">Home</LocalizedClientLink>
          <span className="mx-2">/</span>
          <span className="text-black font-semibold">{breadcrumbName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mt-4">
          <div className="flex-1 min-w-0">
            <ImageGallery images={images} />
          </div>

          <div className="w-full lg:w-[460px] shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3">Home / {title}</div>
              <h1 className="text-3xl font-semibold mb-2 text-black">{title}</h1>
              <p className="text-sm text-gray-500 mb-6 font-medium">{subtitle}</p>

              <div className="flex items-end gap-3 mb-6">
                {product && <ProductPrice product={product} variant={selectedVariant} />}
              </div>

              <div className="mb-6">
                {(product?.options || []).length > 0 ? (
                  (product?.options || []).map((option) => (
                    <div key={option.id} className="mb-4">
                      <OptionSelect
                        option={option as any}
                        current={options[option.id]}
                        updateOption={setOptionValue}
                        title={option.title ?? ""}
                        disabled={isAdding}
                        colorHexMap={
                          (option.title?.toLowerCase() === "color" &&
                            (metadata.color_hex_map as Record<string, string>)) ||
                          undefined
                        }
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="text-xs font-bold mb-3 uppercase tracking-widest text-gray-500">Choose Color</div>
                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 border border-black rounded-full px-3 py-1.5 bg-white shadow-sm">
                        <span className="w-4 h-4 rounded-full bg-black border border-gray-300"></span>
                        <span className="text-xs font-bold text-black">Black</span>
                      </button>
                      <button className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:border-black transition-colors">
                        <span className="w-4 h-4 rounded-full bg-[#8b5a2b] border border-gray-300"></span>
                        <span className="text-xs font-bold text-gray-600">Brown</span>
                      </button>
                      <button className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-1.5 hover:border-black transition-colors">
                        <span className="w-4 h-4 rounded-full bg-white border border-gray-300"></span>
                        <span className="text-xs font-bold text-gray-600">White</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center border border-gray-200 rounded-full w-max mb-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black font-bold"
                >−</button>
                <div className="w-10 text-center text-sm font-bold">{quantity}</div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-black font-bold"
                >+</button>
              </div>

              <div className="flex gap-4 mb-4">
                <Button variant="primary" className="!w-full" onClick={handleAddToCart} disabled={isAdding}>
                  {isAdding ? "Processing..." : "Buy Now"}
                </Button>
                <Button variant="secondary" className="!w-full" disabled={isAdding} onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-800 text-[11px] uppercase tracking-widest font-bold text-center py-3 rounded-xl mb-8">
                <span className="text-sm font-bold">₹</span>
                Save up to 20% with subscription
              </div>

              {/* FEATURE ICONS */}
              {(() => {
                const ICON_SVGS: Record<string, string> = {
                  shipping:   '<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/>',
                  return:     '<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>',
                  eco:        '<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>',
                  natural:    '<path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
                  refillable: '<path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>',
                  organic:    '<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>',
                  kit:        '<path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
                  star:       '<path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>',
                  award:      '<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>',
                  lock:       '<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>',
                  truck:      '<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>',
                  gift:       '<path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1014.25 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 119.75 7.5H12m0 0H8.625M12 7.5h3.375m0 0a3 3 0 013 3v1.5M8.625 7.5a3 3 0 00-3 3v1.5m12.75 0h-12m12 0a3 3 0 013 3v1.5m-15.75-3v-1.5m0 4.5v-1.5"/>',
                  leaf:       '<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 0C7.857 5.25 4.5 8.607 4.5 12.75c0 2.588 1.276 4.875 3.234 6.277A9.015 9.015 0 0012 20.25a9.015 9.015 0 004.266-1.223C18.224 17.625 19.5 15.338 19.5 12.75 19.5 8.607 16.143 5.25 12 5.25z"/>',
                  thumb:      '<path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z"/>',
                }
                const defaultBadges = [
                  { iconId: "shipping", label: "Free Shipping" },
                  { iconId: "return",   label: "30 Day Return" },
                  { iconId: "eco",      label: "Eco Friendly" },
                  { iconId: "kit",      label: "Complete Kit" },
                ]
                let activeBadges = defaultBadges
                if (metadata.product_badges) {
                  try {
                    const parsed = typeof metadata.product_badges === "string"
                      ? JSON.parse(metadata.product_badges)
                      : metadata.product_badges
                    if (Array.isArray(parsed) && parsed.length === 4) activeBadges = parsed
                  } catch {}
                }
                return (
                  <div className="flex justify-between items-center py-8 border-t border-b border-gray-100 mb-8 max-w-full overflow-x-auto gap-4 no-scrollbar">
                    {activeBadges.map((badge: { iconId: string; label: string }, idx: number) => {
                      const svg = ICON_SVGS[badge.iconId] || ICON_SVGS["shipping"]
                      return (
                        <div key={idx} className="text-center flex flex-col items-center gap-3 min-w-[70px]">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-black border border-gray-100">
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                              dangerouslySetInnerHTML={{ __html: svg }} />
                          </div>
                          <span className="text-[9px] font-bold text-black tracking-widest uppercase whitespace-nowrap">{badge.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* ACCORDIONS */}
              <div className="space-y-0">
                <div className="border-b border-gray-100 py-4 pb-6">
                  <div
                    className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer text-black"
                    onClick={() => toggleAccordion("description")}
                  >
                    <span>Product Description</span>
                    <span className="text-gray-400">{activeAccordion === "description" ? "−" : "+"}</span>
                  </div>
                  {activeAccordion === "description" && (
                    <div className="mt-4 text-gray-500 text-sm leading-relaxed">
                      <p className="mb-4">{product.description as string}</p>
                      {metadata.key_benefits && (
                        <ul className="list-disc pl-5 space-y-1">
                          {Array.isArray(metadata.key_benefits) ? (
                            (metadata.key_benefits as any[]).map((benefit, i) => (
                              <li key={i}>{benefit as any}</li>
                            ))
                          ) : typeof metadata.key_benefits === 'string' ? (
                            metadata.key_benefits.split('\n').map((benefit: string, i: number) => (
                              <li key={i}>{benefit}</li>
                            ))
                          ) : null}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {!!metadata.how_to_use && (
                  <div className="border-b border-gray-100 py-4">
                    <div
                      className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black"
                      onClick={() => toggleAccordion("how")}
                    >
                      <span>How To Use</span>
                      <span className="text-gray-400">{activeAccordion === "how" ? "−" : "+"}</span>
                    </div>
                    {activeAccordion === "how" && (
                      <div className="mt-4 space-y-4">
                        {(metadata.how_to_use as any[]).map((step, i) => (
                          <div key={i}>
                            <h4 className="font-bold text-xs text-black uppercase mb-1">Step {i + 1}: {step.title}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {metadata.specifications && (
                  <div className="border-b border-gray-100 py-4">
                    <div
                      className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black"
                      onClick={() => toggleAccordion("specs")}
                    >
                      <span>Specifications</span>
                      <span className="text-gray-400">{activeAccordion === "specs" ? "−" : "+"}</span>
                    </div>
                    {activeAccordion === "specs" && (
                      <div className="mt-4 pb-4">
                        <table className="w-full text-sm text-left">
                          <tbody>
                            {Object.entries(metadata.specifications as Record<string, any>).map(([key, value], i) => (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-2 font-semibold text-gray-400 uppercase text-[10px] tracking-widest w-1/3">{key}</td>
                                <td className="py-2 text-gray-600 font-medium">{value as any}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                <div className="border-b border-gray-100 py-4">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black">
                    <span>Shipping & Returns</span>
                    <span className="text-gray-400">+</span>
                  </div>
                </div>
                <div className="py-4">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black">
                    <span>Manufacturer Details</span>
                    <span className="text-gray-400">+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section style={s.howSection as any}>
        <div style={s.inner as any}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold mb-2 text-black">How It Works</h2>
            <p className="text-gray-500 text-sm tracking-wide">Follow these simple steps for perfect results</p>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(4, ((product.metadata?.how_to_use as any[])?.length || 4))} gap-6`}>
            {product.metadata?.how_to_use ? (
              (() => {
                const raw = product.metadata.how_to_use
                const steps: { title: string; description: string }[] = Array.isArray(raw)
                  ? raw
                  : String(raw).split(/\n+/).filter(Boolean).map((line, i) => ({ title: `Step ${i + 1}`, description: line.trim() }))
                return steps.map((step, index) => (
                <div key={index} className="text-left">
                  <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img
                      src={`${imgBase}how${(index % 4) + 1}.png`}
                      alt={step.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black whitespace-nowrap">{index + 1}. {step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">{step.description}</p>
                </div>
              ))
              })()
            ) : (
              <>
                <div className="text-left">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how1.png" alt="Clean" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black whitespace-nowrap">1. Clean</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Remove dirt and debris from your shoes.</p>
                </div>
                <div className="text-left">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how2.png" alt="Apply" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black whitespace-nowrap">2. Apply</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Use the solution with gentle circular motions.</p>
                </div>
                <div className="text-left">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how3.png" alt="Dry" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black whitespace-nowrap">3. Dry</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Let your shoes air dry naturally.</p>
                </div>
                <div className="text-left">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how4.png" alt="Protect" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black whitespace-nowrap">4. Protect</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Apply protective coating for longevity.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* BRAND PROMISE SPLIT */}
      <div className="flex flex-col md:flex-row w-full bg-white mb-20 min-h-[600px]">
        <div className="flex-1 bg-black relative overflow-hidden group min-h-[400px] md:min-h-full">
          <img
            src="/images/product-detail-images/product-slider-1.png"
            className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            alt="Brand Brand"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        </div>
        <div className="flex-1 bg-[#f0f0f5] flex items-center justify-center p-12 text-center relative overflow-hidden min-h-[300px] md:min-h-full">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs lg:text-sm font-bold tracking-[0.2em] text-gray-500 mb-4 uppercase">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(16px,2vw,28px)] font-black leading-tight mb-8 uppercase text-black whitespace-nowrap overflow-hidden text-ellipsis">Crafting World - Class Care For Every Step</h2>
            <LocalizedClientLink href="/about">
              <Button variant="primary">Read More</Button>
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      <div style={s.inner as any}>
        {/* RELATED PRODUCTS / COMPLETE YOUR ROUTINE */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-semibold mb-2">Complete Your Routine</h2>
          <p className="text-gray-500 text-sm tracking-wide mb-12">Products that work perfectly together</p>
          <div data-testid="related-products-container">
            {relatedProducts}
          </div>
        </div>

        {/* FAQ SECTION */}
        <div className="py-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold mb-2 text-center">Frequently Asked Questions</h2>
          <p className="text-gray-500 text-sm tracking-wide text-center mb-12">Everything you need to know about our products</p>
          <div className="space-y-0 text-left">
            <div className="border-b border-gray-200 py-6 text-sm">
              <button className="flex justify-between items-center w-full group">
                <span className="font-semibold text-black">Can I use this on all materials?</span>
                <span className="text-gray-400 group-hover:text-black">v</span>
              </button>
            </div>
            <div className="border-b border-gray-200 py-6 text-sm">
              <button className="flex justify-between items-center w-full group mb-4">
                <span className="font-semibold text-black">How often should I use this product?</span>
                <span className="text-gray-400 group-hover:text-black">^</span>
              </button>
              <p className="text-gray-600 leading-relaxed font-medium">
                We recommend using it once a week for regular maintenance, or as needed depending on how frequently you wear your shoes.
              </p>
            </div>
            <div className="border-b border-gray-200 py-6 text-sm">
              <button className="flex justify-between items-center w-full group">
                <span className="font-semibold text-black">Is this environment friendly?</span>
                <span className="text-gray-400 group-hover:text-black">v</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StagingProductTemplate
