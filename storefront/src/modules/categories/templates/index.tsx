import { notFound } from "next/navigation"
import { Suspense } from "react"

import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getBanners } from "@lib/data/banners"
import { HttpTypes } from "@medusajs/types"

const s = {
  container: { width: '100%', backgroundColor: '#fff', color: '#000' },
  inner: { maxWidth: '1488px', margin: '0 auto', padding: '0 var(--container-padding)' },
  breadcrumb: { padding: '20px 0', fontSize: '13px', color: '#888' },
  heroBanner: {
    width: '100%',
    height: 'auto',
    aspectRatio: '14 / 3',
    maxHeight: '240px',
    borderRadius: '16px',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '32px',
    backgroundColor: '#1a1a1a'
  },
  heroBg: { width: '100%', height: '100%', objectFit: 'cover', opacity: '1' },
  heroContent: { position: 'absolute', top: '50%', left: 'clamp(20px, 5vw, 60px)', transform: 'translateY(-50%)', color: '#fff' },
  heroTitle: { fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: '800', marginBottom: '8px' },
  heroSub: { fontSize: '16px', opacity: '0.9' },
  body: { gap: '32px', paddingBottom: '80px' },
  sidebar: { width: '270px', flexShrink: 0, minWidth: '270px', maxWidth: '270px' },
  main: { flex: 1, minWidth: 0 },
}

type StoreFilterOption = {
  value: string
  label: string
}

const getUniqueFilterOptions = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  )

const getProductOptionValues = (
  products: HttpTypes.StoreProduct[],
  optionTitle: string
): StoreFilterOption[] =>
  getUniqueFilterOptions(
    products.flatMap(
      (product) =>
        product.options
          ?.filter(
            (option) => option.title?.toLowerCase() === optionTitle.toLowerCase()
          )
          .flatMap(
            (option) =>
              option.values?.map((value) => value.value || "") || []
          ) || []
    )
  ).map((value) => ({
    value,
    label: value,
  }))

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  collection,
  type,
  size,
  color,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode?: string
  collection?: string
  type?: string
  size?: string
  color?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at_asc"
  const country = countryCode || "in"

  if (!category) notFound()

  // Fetch available filter options specifically for this category and dynamic header banners
  const [
    { response: { products } },
    { collections },
    categoryBanners,
  ] = await Promise.all([
    listProducts({
      countryCode: country,
      queryParams: {
        category_id: [category.id],
        limit: 100,
      },
    }),
    listCollections({
      limit: "100",
    }),
    getBanners("category_banner"),
  ])

  const activeCollectionIds = new Set(
    products.map((product) => product.collection_id).filter(Boolean)
  )

  const collectionOptions: StoreFilterOption[] = collections
    .filter((item) => activeCollectionIds.has(item.id))
    .map((item) => ({
      value: item.handle || "",
      label: item.title,
    }))
    .filter((item) => item.value)
    .sort((a, b) => a.label.localeCompare(b.label))

  const typeOptions: StoreFilterOption[] = getUniqueFilterOptions(
    products.map((product) => product.type?.value || "").filter(Boolean)
  ).map((value) => ({
    value,
    label: value,
  }))

  const sizeOptions = getProductOptionValues(products, "Size")
  const colorOptions = getProductOptionValues(products, "Color")

  const imgBase = '/images/product-category-images/'
  const dynamicBanner = categoryBanners.find(
    (b) => b.link_url.includes(category.handle) || b.title.toLowerCase().includes(category.handle.replace("-", " "))
  )
  const bannerImageSrc = dynamicBanner?.desktop_image_url || (imgBase + (['shoe-care', 'insoles', 'foot-care', 'accessories'].includes(category.handle) ? `banner-${category.handle}.png` : 'top-side-banner-background.png'))

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
          <img 
            src={bannerImageSrc} 
            style={s.heroBg as any} 
            alt={dynamicBanner?.alt_text || `${category.name} Banner`} 
          />
        </div>

        <div style={s.body as any} className="hero-flex">
          <aside style={s.sidebar as any} className="hidden lg:block">
            <div className="solid-box p-5 sticky top-28 bg-gray-50/50 backdrop-blur-sm">
              <h3 className="font-bold text-sm mb-3 border-b pb-2 uppercase tracking-wider">Filters & Sort</h3>
              <RefinementList
                sortBy={sort}
                collections={collectionOptions}
                types={typeOptions}
                sizes={sizeOptions}
                colors={colorOptions}
                embedded={true}
                selectedFilters={{
                  collection,
                  type,
                  size,
                  color,
                }}
              />
            </div>
          </aside>

          <main
            style={{ ...(s.main as any), animationDelay: "0.2s" }}
            className="animate-fade-in-up w-full"
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
                categoryHandle={category.handle}
                countryCode={country}
                collectionHandle={collection}
                typeValue={type}
                sizeValue={size}
                colorValue={color}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}
