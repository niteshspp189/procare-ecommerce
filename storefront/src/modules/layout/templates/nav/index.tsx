import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchModal from "@modules/layout/components/search-modal"

const styles = {
  topNav: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '8px var(--container-padding)',
    backgroundColor: '#1a1a1a',
    fontSize: '11px',
    gap: '24px',
    color: '#fff',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  topLink: {
    textDecoration: 'none',
    color: '#fff',
    fontWeight: '500',
    opacity: '0.8',
    transition: 'opacity 0.2s'
  },
  mainNav: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px var(--container-padding)',
    backgroundColor: '#fff',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    position: 'relative',
    zIndex: 1000,
    borderBottom: '1px solid #f3f4f6'
  },
  logo: {
    height: '44px',
    transition: 'transform 0.3s ease'
  },
  menu: {
    gap: '36px',
    alignItems: 'center'
  },
  menuLink: {
    textDecoration: 'none',
    color: '#000',
    fontSize: '15px',
    fontWeight: '700',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 0',
    transition: 'color 0.2s'
  },
  rightSection: {
    alignItems: 'center',
    gap: '24px'
  },
  searchContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  icon: {
    fontSize: '22px',
    cursor: 'pointer',
    color: '#000',
    textDecoration: 'none',
    transition: 'transform 0.2s ease',
    alignItems: 'center'
  }
}

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50 animate-fade-in">
      {/* Black Top bar for premium feel */}
      <div style={styles.topNav as any} className="hidden lg:flex">
        <LocalizedClientLink href="/" style={styles.topLink} className="hover:opacity-100">Home</LocalizedClientLink>
        <LocalizedClientLink href="/blog" style={styles.topLink} className="hover:opacity-100">Blogs</LocalizedClientLink>
        <LocalizedClientLink href="/account" style={styles.topLink} className="hover:opacity-100">Log In</LocalizedClientLink>
      </div>

      <nav style={styles.mainNav as any} className="flex">
        <div className="flex items-center">
          <LocalizedClientLink href="/" className="flex items-center group">
            <img src="/images/logos/logo.png" alt="PRO" style={styles.logo} className="group-hover:scale-105" />
          </LocalizedClientLink>
        </div>

        <div style={styles.menu as any} className="hidden lg:flex">
          <LocalizedClientLink href="/shop" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px]">
            Shop All
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/shoe-care" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px]">
            Shoe Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/insoles" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px]">
            Insoles
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/foot-care" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px]">
            Foot Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/accessories" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px]">
            Accessories
          </LocalizedClientLink>
        </div>

        <div style={styles.rightSection as any} className="flex">
          <div style={styles.searchContainer as any} className="hidden md:flex group">
            <SearchModal />
          </div>

          <LocalizedClientLink href="/account" style={styles.icon} className="hidden md:flex hover:scale-110">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </LocalizedClientLink>

          <div className="flex items-center gap-x-5">
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="group flex items-center"
                  href="/cart"
                  aria-label="Cart (0)"
                >
                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200 group-hover:bg-gray-100">
                    <ShoppingBag
                      size={24}
                      className="transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold leading-none text-white">
                      0
                    </span>
                  </span>
                  <span className="sr-only">Cart (0)</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
          <div className="flex lg:hidden ml-3">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
          </div>
        </div>
      </nav>
    </div>
  )
}
