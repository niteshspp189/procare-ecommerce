import { notFound } from "next/navigation"
import { Suspense } from "react"

import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

const s = {
  container: { width: '100%', backgroundColor: '#fff', color: '#000' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 var(--container-padding)' },
  breadcrumb: { padding: '20px 0', fontSize: '13px', color: '#888' },
  heroBanner: {
    width: '100%',
    height: 'clamp(180px, 30vw, 240px)',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '40px',
    backgroundColor: '#1a1a1a'
  },
  heroBg: { width: '100%', height: '100%', objectFit: 'cover', opacity: '0.8' },
  heroContent: { position: 'absolute', top: '50%', left: 'clamp(20px, 5vw, 60px)', transform: 'translateY(-50%)', color: '#fff' },
  heroTitle: { fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: '800', marginBottom: '8px' },
  heroSub: { fontSize: '16px', opacity: '0.9' },
  body: { gap: '40px', paddingBottom: '80px' },
  sidebar: { width: '260px', flexShrink: 0 },
  main: { flex: 1 },
}

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category) notFound()

  const imgBase = '/images/product-category-images/'

  return (
    <div style={s.container as any} className="animate-fade-in">
      <div style={s.inner as any}>
        <div style={s.breadcrumb as any} className="opacity-60 hover:opacity-100 transition-opacity">
          <LocalizedClientLink href="/" className="hover:text-black transition-colors">Home</LocalizedClientLink>
          <span className="mx-2">&gt;</span>
          <span>Shop</span>
          <span className="mx-2">&gt;</span>
          <span className="text-black font-bold">{category.name}</span>
        </div>

        <div style={s.heroBanner as any} className="animate-scale-in">
          <img src={imgBase + 'top-side-banner-background.png'} style={s.heroBg as any} alt="Banner" />
          <div style={s.heroContent as any}>
            <h1 style={s.heroTitle as any} className="animate-fade-in-up">{category.name}</h1>
            <p style={s.heroSub as any} className="animate-fade-in-up delay-100">{category.description || "Finish line rich results every day"}</p>
          </div>
        </div>

        <div style={s.body as any} className="hero-flex">
          <aside style={s.sidebar as any} className="hidden lg:block">
            <div className="solid-box p-8 sticky top-28 bg-gray-50/50 backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-4 border-b pb-2 uppercase tracking-wider">Filters</h3>
              <RefinementList sortBy={sort} />
            </div>
          </aside>

          <main
            style={{ ...(s.main as any), animationDelay: "0.2s" }}
            className="animate-fade-in-up"
          >
            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={8}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
                countryCode={countryCode}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
