import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import ProductActionsWrapper from "./product-actions-wrapper"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const s = {
  container: { width: '100%', backgroundColor: '#fff', color: '#000' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 var(--container-padding)' },
  breadcrumb: { padding: '20px 0', fontSize: '13px', color: '#888' },
  howSection: { backgroundColor: '#000', color: '#fff', padding: '80px 0', marginTop: '60px' },
  howTitle: { textAlign: 'center', fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '800', marginBottom: '12px' },
  howSub: { textAlign: 'center', fontSize: '16px', opacity: '0.7', marginBottom: '60px' },
  stepCard: { textAlign: 'center' },
  stepImg: { width: '100%', height: '220px', objectFit: 'contain' as const, backgroundColor: '#fff', borderRadius: '12px', marginBottom: '20px' },
  premium: { padding: '80px 0' },
  premiumFlex: { display: 'flex', alignItems: 'center', gap: '40px', backgroundColor: '#000', borderRadius: '16px', padding: 'clamp(24px, 8vw, 60px)', color: '#fff' },
  premiumH2: { fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: '800', marginBottom: '20px' },
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const imgBase = '/images/product-detail-images/'

  return (
    <div style={s.container as any} className="animate-fade-in">
      <div style={s.inner as any}>
        <div style={s.breadcrumb as any} className="opacity-60 hover:opacity-100 transition-opacity">
          <LocalizedClientLink href="/" className="hover:text-black transition-colors uppercase tracking-widest text-[11px] font-bold">Home</LocalizedClientLink>
          <span className="mx-2 font-light">/</span>
          <span className="uppercase tracking-widest text-[11px] font-medium">Shop</span>
          <span className="mx-2 font-light">/</span>
          <span className="text-black font-extrabold uppercase tracking-widest text-[11px]">{product.title}</span>
        </div>

        <div className="hero-flex">
          <div className="flex-1 min-w-0">
            <ImageGallery images={images} />
          </div>

          <div className="w-full lg:w-[480px] shrink-0">
            <div className="solid-box p-8 md:p-12 sticky top-28 bg-white backdrop-blur-md animate-fade-in-up">
              <ProductInfo product={product} />
              <div className="mt-10">
                <Suspense
                  fallback={
                    <ProductActions
                      disabled={true}
                      product={product}
                      region={region}
                    />
                  }
                >
                  <ProductActionsWrapper id={product.id} region={region} />
                </Suspense>
              </div>

              {/* FEATURE ICONS SECTION */}
              <div className="grid grid-cols-4 gap-4 mt-12 py-8 border-t border-gray-100">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Natural</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12A9 9 0 1 1 3 12A9 9 0 0 1 21 12Z" /><path d="M12 8V12L15 15" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Refillable</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /><path d="M12 18V12L15 9" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Eco Friendly</span>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 21L7 17L11 13" /><path d="M17 3L21 7L17 11" /><path d="M3 13L7 17L3 21" /><path d="M21 7H7a2 2 0 0 0-2 2v2" /><path d="M3 17h14a2 2 0 0 0 2-2v-2" /></svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Organic</span>
                </div>
              </div>

              <div className="mt-8 border-t pt-8">
                <ProductTabs product={product} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section style={s.howSection as any} className="mt-24 overflow-hidden bg-white text-black border-y border-gray-100">
        <div style={s.inner as any}>
          <div className="text-center mb-16 animate-fade-in-up py-12">
            <h2 className="text-4xl font-black uppercase mb-4">How It Works</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Professional results in four simple steps</p>
          </div>
          <div className="responsive-grid-4 gap-8 mb-20">
            <div className="animate-fade-in-up group" style={{ animationDelay: '0.1s' }}>
              <div className="relative aspect-square overflow-hidden rounded-3xl mb-6 bg-gray-50 shadow-sm border border-gray-100">
                <img src={imgBase + 'how1.png'} alt="Clean" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-6 left-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Clean</h3>
              <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tight">Remove surface dirt with a premium brush to prepare for conditioning.</p>
            </div>
            <div className="animate-fade-in-up group" style={{ animationDelay: '0.2s' }}>
              <div className="relative aspect-square overflow-hidden rounded-3xl mb-6 bg-gray-50 shadow-sm border border-gray-100">
                <img src={imgBase + 'how2.png'} alt="Apply" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-6 left-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Apply</h3>
              <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tight">Apply the leather care solution evenly across the entire surface area.</p>
            </div>
            <div className="animate-fade-in-up group" style={{ animationDelay: '0.3s' }}>
              <div className="relative aspect-square overflow-hidden rounded-3xl mb-6 bg-gray-50 shadow-sm border border-gray-100">
                <img src={imgBase + 'how3.png'} alt="Dry" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-6 left-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Dry</h3>
              <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tight">Allow the product to air dry naturally in a cool environment (approx 15-20 min).</p>
            </div>
            <div className="animate-fade-in-up group" style={{ animationDelay: '0.4s' }}>
              <div className="relative aspect-square overflow-hidden rounded-3xl mb-6 bg-gray-50 shadow-sm border border-gray-100">
                <img src={imgBase + 'how4.png'} alt="Protect" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-6 left-6 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-lg">4</div>
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Protect</h3>
              <p className="text-gray-500 text-sm leading-relaxed uppercase tracking-tight">Your premium leather is now ready! Step out with confidence and comfort.</p>
            </div>
          </div>
        </div>
      </section>

      <div style={s.inner as any}>
        {/* BRAND PROMISE BANNER */}
        <div className="my-24 bg-black rounded-3xl p-12 md:p-24 text-center animate-fade-in-up text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-bold tracking-[0.3em] text-gray-500 mb-6 uppercase">German Precision. Indian Excellence. Trusted Worldwide.</p>
            <h2 className="text-[clamp(30px,6vw,56px)] font-black uppercase leading-[1.05] mb-12">Crafting World - Class <br /> Care For Every Step</h2>
            <button className="bg-white text-black px-12 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl">Read More</button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 -mr-32 -mt-32"></div>
        </div>

        {/* RELATED PRODUCTS */}
        <div className="my-24 animate-fade-in-up" data-testid="related-products-container">
          <div className="flex justify-between items-center mb-10 border-b pb-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Complete Your Routine</h2>
            <LocalizedClientLink href="/store" className="font-bold border-b-2 border-black pb-1 hover:opacity-70 uppercase tracking-widest text-xs">SHOP ALL</LocalizedClientLink>
          </div>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>

        {/* FAQ SECTION */}
        <div className="py-24 border-t border-gray-100 animate-fade-in-up">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-black uppercase mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-6">
                <button className="flex justify-between items-center w-full text-left group">
                  <span className="font-bold uppercase tracking-tight text-lg">How often should I use the kit?</span>
                  <span className="text-2xl font-light group-hover:rotate-45 transition-transform">+</span>
                </button>
                <p className="mt-4 text-gray-500 leading-relaxed uppercase text-sm tracking-tight">For best results, we recommend a deep clean every 2-4 weeks depending on usage.</p>
              </div>
              <div className="border-b border-gray-100 pb-6">
                <button className="flex justify-between items-center w-full text-left group">
                  <span className="font-bold uppercase tracking-tight text-lg">Is it safe for all leather types?</span>
                  <span className="text-2xl font-light group-hover:rotate-45 transition-transform">+</span>
                </button>
                <p className="mt-4 text-gray-500 leading-relaxed uppercase text-sm tracking-tight">Yes, our formula is neutral pH balanced and safe for all smooth and treated leathers.</p>
              </div>
              <div className="border-b border-gray-100 pb-6">
                <button className="flex justify-between items-center w-full text-left group">
                  <span className="font-bold uppercase tracking-tight text-lg">What is the return policy?</span>
                  <span className="text-2xl font-light group-hover:rotate-45 transition-transform">+</span>
                </button>
                <p className="mt-4 text-gray-500 leading-relaxed uppercase text-sm tracking-tight">We offer a 30-day no-questions-asked return policy for all sealed products.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
