"use client"

import React, { Suspense, useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { useCartDrawer } from "@lib/context/cart-drawer-context"
import { addToCart } from "@lib/data/cart"
import ProductPrice from "@modules/products/components/product-price"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"

const s = {
  container: { width: '100%', backgroundColor: '#f9f9fb', color: '#000', paddingBottom: '80px' },
  inner: { maxWidth: '1280px', margin: '0 auto', padding: '0 24px' },
  breadcrumb: { padding: '20px 0', fontSize: '12px', color: '#888' },
  howSection: { backgroundColor: '#fff', color: '#000', padding: '80px 0' },
  btnBuy: { flex: 1, padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' as const },
  btnCart: { flex: 1, padding: '14px', backgroundColor: '#f3f4f6', color: '#000', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' as const },
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
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
}) => {
  const images = product?.images || []
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

          <div className="w-full lg:w-[460px] shrink-0">
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
                <button style={s.btnBuy as any} className="hover:bg-gray-800 rounded-full" onClick={handleAddToCart}>
                  {isAdding ? "Processing..." : "Buy Now"}
                </button>
                <button style={s.btnCart as any} className="hover:bg-gray-200 rounded-full" disabled={isAdding} onClick={handleAddToCart}>
                  Add to Cart
                </button>
              </div>

              <div className="bg-[#fef6ed] text-[#db8a52] text-xs font-bold text-center py-2 rounded-[4px] mb-8">
                📦 Save up to 20% in value with subscription
              </div>

              {/* FEATURE ICONS */}
              <div className="flex justify-between items-center py-6 border-t border-b border-gray-100 mb-8">
                <div className="text-center flex flex-col items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-[10px] font-bold text-black tracking-widest uppercase">Free Shipping</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <span className="text-[10px] font-bold text-black tracking-widest uppercase">Complete Kit</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-[10px] font-bold text-black tracking-widest uppercase">30 Day Return</span>
                </div>
                <div className="text-center flex flex-col items-center gap-2">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[10px] font-bold text-black tracking-widest uppercase">Eco Friendly</span>
                </div>
              </div>

              {/* ACCORDIONS */}
              <div className="space-y-0">
                <div className="border-b border-gray-100 py-4 pb-6">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer text-black">
                    <span>Product Description</span>
                    <span className="text-gray-400">−</span>
                  </div>
                  <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                    Our Professional Shoe Care Kit is expertly formulated to clean, condition, and protect all types of footwear. Made with premium ingredients that are gentle yet effective on leather, suede, nubuck, and canvas materials. Each component in this kit has been carefully selected to provide professional-level care for your most valued shoes.
                  </p>
                </div>
                <div className="border-b border-gray-100 py-4">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black">
                    <span>How To Use</span>
                    <span className="text-gray-400">+</span>
                  </div>
                </div>
                <div className="border-b border-gray-100 py-4">
                  <div className="flex justify-between items-center font-bold text-xs uppercase tracking-widest cursor-pointer hover:text-black text-black">
                    <span>Ingredients</span>
                    <span className="text-gray-400">+</span>
                  </div>
                </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-6 mb-4">
                <img src="/images/product-category-images/shoe_care.png" alt="Clean" className="object-contain h-full" />
              </div>
              <h3 className="font-semibold text-base mb-1 text-black">1. Clean</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Remove dirt and debris from your shoes.</p>
            </div>
            <div>
              <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-6 mb-4">
                <img src="/images/product-category-images/shoe_care.png" alt="Apply" className="object-contain h-full" />
              </div>
              <h3 className="font-semibold text-base mb-1 text-black">2. Apply</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Use the solution with gentle circular motions.</p>
            </div>
            <div>
              <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-6 mb-4">
                <img src="/images/products/insole-demo.png" alt="Dry" className="object-contain h-full" />
              </div>
              <h3 className="font-semibold text-base mb-1 text-black">3. Dry</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Let your shoes air dry naturally.</p>
            </div>
            <div>
              <div className="aspect-[4/3] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-6 mb-4">
                <img src="/images/product-category-images/foot_care.png" alt="Protect" className="object-contain h-full" />
              </div>
              <h3 className="font-semibold text-base mb-1 text-black">4. Protect</h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[250px]">Apply protective coating for longevity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND PROMISE SPLIT */}
      <div className="flex flex-col md:flex-row w-full bg-white mb-20 min-h-[400px]">
        <div className="flex-1 bg-black">
           {/* video place holder exact same as staging homepage */}
        </div>
        <div className="flex-1 bg-[#f0f0f5] flex items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-lg">
            <p className="text-sm font-normal tracking-[0.05em] text-gray-500 mb-2">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(28px,4vw,40px)] font-normal leading-tight mb-8">Crafting World - Class Care For Every Step</h2>
            <button className="bg-black text-white px-8 py-3 rounded-full font-medium text-sm hover:bg-gray-800 transition-all shadow-xl">Read More</button>
          </div>
        </div>
      </div>

      <div style={s.inner as any}>
        {/* RELATED PRODUCTS / COMPLETE YOUR ROUTINE */}
        <div className="py-16 text-center">
            <h2 className="text-3xl font-semibold mb-2">Complete Your Routine</h2>
            <p className="text-gray-500 text-sm tracking-wide mb-12">Products that work perfectly together</p>
            <div data-testid="related-products-container">
            <Suspense fallback={<SkeletonRelatedProducts />}>
                {product && <RelatedProducts product={product} countryCode={countryCode} isStaging={true} />}
            </Suspense>
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
