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

  const isSingleDefaultVariant = useMemo(() => {
    if (!product?.variants || product.variants.length !== 1) return false
    const opts = product.variants[0].options || []
    if (opts.length === 0) return true
    return (opts as any[]).every((opt: any) => {
      const val = (opt.value || '').toLowerCase()
      return val === 'default' || val === 'standard' || val === ''
    })
  }, [product?.variants])

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
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const toggleAccordion = (name: string) => {
    setActiveAccordion(activeAccordion === name ? null : name)
  }

  const metadata = product?.metadata || {}

  const mrpSeed = useMemo(() => {
    return product?.id?.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) ?? 7
  }, [product?.id])

  const parseLines = (content: any): string[] => {
    if (!content) return []
    const str = typeof content === 'string' ? content
      : Array.isArray(content) ? (content as any[]).map((c: any) => typeof c === 'string' ? c : c?.description || c?.title || '').join('\n')
      : JSON.stringify(content)
    return str.replace(/\*\*/g, '').split('\n')
      .map((l: string) => l.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter((l: string) => l.length > 0)
  }

  const howToUseSteps = useMemo((): { title: string; description: string }[] => {
    if (!metadata.how_to_use) return []
    if (Array.isArray(metadata.how_to_use)) return metadata.how_to_use as { title: string; description: string }[]
    return String(metadata.how_to_use).replace(/\*\*/g, '').split('\n').filter(Boolean)
      .map((line: string, i: number) => ({
        title: `Step ${i + 1}`,
        description: line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim()
      }))
  }, [metadata.how_to_use])

  const faqItems = [
    { q: "Can I use this on all materials?", a: "Yes, our formula is safe for all smooth and treated leather, suede, and fabric materials." },
    { q: "How often should I use this product?", a: "We recommend once a week for regular maintenance, or as needed based on wear frequency." },
    { q: "Is it environment friendly?", a: "Absolutely. Our products use eco-certified, non-toxic ingredients safe for daily use." },
    { q: "What is the return policy?", a: "We offer a 30-day return policy for all sealed and unused products. No questions asked." },
  ]

  return (
    <div style={s.container as any} className="font-sans">
      <div style={s.inner as any}>
        <div style={s.breadcrumb as any}>
          <LocalizedClientLink href="/" className="hover:text-black">Home</LocalizedClientLink>
          <span className="mx-2">/</span>
          <span className="text-black font-semibold">{breadcrumbName}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mt-4">
          <div className="w-full lg:flex-1 min-w-0">
            <ImageGallery images={images} />
          </div>

          <div className="w-full lg:w-[42%] shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3">Home / {title}</div>
              <h1 className="text-3xl font-semibold mb-2 text-black">{title}</h1>
              <p className="text-sm text-gray-500 mb-6 font-medium">{subtitle}</p>

              <div className="flex items-baseline gap-4 mb-1">
                {product && <ProductPrice product={product} variant={selectedVariant} />}
                {selectedVariant?.calculated_price?.calculated_amount != null && selectedVariant.calculated_price.calculated_amount > 0 && (() => {
                  const pct = 10 + (mrpSeed % 6)
                  const base = selectedVariant.calculated_price.calculated_amount as number
                  const mrp = Math.round(base * (1 + pct / 100) / 10) * 10
                  return <span className="text-gray-400 text-base line-through">₹{mrp.toFixed(2)}</span>
                })()}
              </div>
              <p className="text-xs text-gray-400 mb-6">(Inclusive of all taxes)</p>

              <div className="mb-6">
                {isSingleDefaultVariant ? (
                  <div>
                    <div className="text-xs font-bold mb-3 uppercase tracking-widest text-gray-500">Size</div>
                    <div className="inline-flex items-center border-2 border-black rounded-full px-5 py-2 bg-white">
                      <span className="text-sm font-bold text-black">{subtitle}</span>
                    </div>
                  </div>
                ) : (product?.options || []).length > 0 ? (
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

              <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] uppercase tracking-widest font-bold text-center py-3 rounded-xl mb-8">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                Delivered in 5–6 business days
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
                          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border-2 border-emerald-100">
                            <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                              dangerouslySetInnerHTML={{ __html: svg }} />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-700 tracking-widest uppercase whitespace-nowrap">{badge.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* ACCORDIONS */}
              <div className="space-y-2">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer px-5 py-4 hover:bg-gray-50 text-black"
                    onClick={() => toggleAccordion("description")}
                  >
                    <span>Product Description</span>
                    <svg className={`w-4 h-4 transition-transform text-gray-400 ${activeAccordion === "description" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {activeAccordion === "description" && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 text-gray-600 text-sm leading-relaxed">
                      <p className="mb-4">{String(product.description || '').replace(/\*\*/g, '')}</p>
                      {metadata.key_benefits && (
                        <ul className="space-y-1 mt-2">
                          {parseLines(metadata.key_benefits).map((line: string, i: number) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {!!metadata.how_to_use && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer px-5 py-4 hover:bg-gray-50 text-black"
                      onClick={() => toggleAccordion("how")}
                    >
                      <span>How To Use</span>
                      <svg className={`w-4 h-4 transition-transform text-gray-400 ${activeAccordion === "how" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {activeAccordion === "how" && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                        {howToUseSteps.map((step, i) => (
                          <div key={i}>
                            <h4 className="font-bold text-xs text-black uppercase mb-1">Step {i + 1}: {String(step.title).replace(/\*\*/g, '')}</h4>
                            <p className="text-sm text-gray-500 leading-relaxed">{String(step.description).replace(/\*\*/g, '').replace(/^[-•]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {metadata.specifications && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer px-5 py-4 hover:bg-gray-50 text-black"
                      onClick={() => toggleAccordion("specs")}
                    >
                      <span>Specifications</span>
                      <svg className={`w-4 h-4 transition-transform text-gray-400 ${activeAccordion === "specs" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    {activeAccordion === "specs" && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100">
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
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer px-5 py-4 hover:bg-gray-50 text-black"
                    onClick={() => toggleAccordion("shipping")}
                  >
                    <span>Shipping & Returns</span>
                    <svg className={`w-4 h-4 transition-transform text-gray-400 ${activeAccordion === "shipping" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {activeAccordion === "shipping" && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-3 text-sm text-gray-600">
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Delivery:</strong> Ships within 5–6 business days across India.</span></div>
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Free Delivery:</strong> On all orders above ₹499.</span></div>
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Cash on Delivery:</strong> Available on select pincodes.</span></div>
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Returns:</strong> 30-day return policy for sealed and unused products.</span></div>
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Exchange:</strong> Available within 7 days of delivery. Contact us at connect@mvscindia.com.</span></div>
                      <div className="flex items-start gap-2"><span className="text-emerald-500 font-bold mt-0.5">✓</span><span><strong className="text-black">Packaging:</strong> Securely packed to prevent transit damage.</span></div>
                    </div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div
                    className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer px-5 py-4 hover:bg-gray-50 text-black"
                    onClick={() => toggleAccordion("manufacturer")}
                  >
                    <span>Manufacturer Details</span>
                    <svg className={`w-4 h-4 transition-transform text-gray-400 ${activeAccordion === "manufacturer" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  {activeAccordion === "manufacturer" && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100 text-sm text-gray-600 space-y-2">
                      <p><strong className="text-black">Company:</strong> M V SHOE CARE PVT LTD</p>
                      <p><strong className="text-black">Address:</strong> A-13, SECTOR-59, NOIDA, UTTAR PRADESH – 201301, INDIA</p>
                      <p><strong className="text-black">Contact:</strong> +91-120-429-9685</p>
                      <p><strong className="text-black">Email:</strong> connect@mvscindia.com</p>
                    </div>
                  )}
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
          <div style={{ overflowX: 'auto', textAlign: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '24px' } as React.CSSProperties}>
          <div className="snap-x snap-mandatory" style={{ display: 'inline-flex', gap: '32px', textAlign: 'left' } as React.CSSProperties}>
            {product.metadata?.how_to_use ? (
              (() => {
                const raw = product.metadata.how_to_use
                const steps: { title: string; description: string }[] = Array.isArray(raw)
                  ? raw
                  : String(raw).replace(/\*\*/g, '').split(/\n+/).filter(Boolean).map((line, i) => ({ title: `Step ${i + 1}`, description: line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '').trim() }))
                return steps.map((step, index) => (
                <div key={index} className="text-left flex-shrink-0 w-[286px] snap-start">
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
                  <h3 className="font-semibold text-base mb-1 text-black">{String(step.title).replace(/\*\*/g, '').replace(/^\d+\.\s*/, '')}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{String(step.description).replace(/\*\*/g, '').replace(/^[-•]\s*/, '')}</p>
                </div>
              ))
              })()
            ) : (
              <>
                <div className="text-left flex-shrink-0 w-[286px] snap-start">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how1.png" alt="Clean" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black">Clean</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Remove dirt and debris from your shoes.</p>
                </div>
                <div className="text-left flex-shrink-0 w-[286px] snap-start">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how2.png" alt="Apply" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black">Apply</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Use the solution with gentle circular motions.</p>
                </div>
                <div className="text-left flex-shrink-0 w-[286px] snap-start">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how3.png" alt="Dry" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black">Dry</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Let your shoes air dry naturally.</p>
                </div>
                <div className="text-left flex-shrink-0 w-[286px] snap-start">
                  <div className="aspect-square bg-transparent rounded-3xl border border-gray-100 flex flex-col items-center justify-center mb-6 overflow-hidden relative group p-0">
                    <img src="/images/product-detail-images/how4.png" alt="Protect" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-black">Protect</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Apply protective coating for longevity.</p>
                </div>
              </>
            )}
          </div>
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
        <div className="flex-1 bg-[#f0f0f5] flex items-center justify-center p-8 lg:p-12 relative overflow-hidden min-h-[300px] md:min-h-full">
          <div className="relative z-10 w-full max-w-lg">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mb-2 uppercase">Got Questions?</p>
            <h2 className="text-xl font-black mb-6 uppercase text-black">Frequently Asked Questions</h2>
            <div className="space-y-2 text-left">
              {faqItems.map((item, i) => (
                <div key={i} className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                  <button
                    className="w-full flex justify-between items-center px-5 py-4 font-bold text-xs uppercase tracking-widest text-black hover:bg-gray-50"
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <span className="text-left">{item.q}</span>
                    <svg className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform text-gray-400 ${faqOpen === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {faqOpen === i && (
                    <div className="px-5 pb-4 pt-2 border-t border-gray-100 text-sm text-gray-600 leading-relaxed normal-case tracking-normal font-normal">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
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

      </div>
    </div>
  )
}

export default StagingProductTemplate
