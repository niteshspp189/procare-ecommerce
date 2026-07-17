import { Suspense } from "react"

import { listRegions } from "@lib/data/regions"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { retrieveCustomer } from "@lib/data/customer"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShoppingBag from "@modules/common/icons/shopping-bag"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import SearchModal from "@modules/layout/components/search-modal"

import { getShippingThreshold } from "@lib/data/fulfillment"

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
    position: 'relative',
    zIndex: 1000,
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
    textDecoration: 'none',
    transition: 'transform 0.2s ease',
    alignItems: 'center'
  }
}

export default async function Nav() {
  const [regions, locales, currentLocale, customer, thresholdData] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    retrieveCustomer().catch(() => null),
    getShippingThreshold(),
  ])

  const threshold = thresholdData?.threshold ?? 499

  return (
    <div className="sticky top-0 inset-x-0 z-50 animate-fade-in">
      {/* Black Top bar for premium feel */}
      <div className="flex justify-between items-center px-3 sm:px-6 py-2 bg-[#141414] text-white text-[10px] sm:text-[11.5px] uppercase tracking-normal sm:tracking-wider border-b border-gray-800 overflow-hidden w-full max-w-full relative">
        {/* Left flex spacer for perfect centering on desktop/laptop */}
        <div className="hidden md:block flex-1"></div>
        
        {/* Promo text and Shop Now button (Centered) */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-1 md:flex-initial min-w-0 shrink-0 mx-auto">
          {/* Mobile scrolling version */}
          <div className="flex sm:hidden overflow-hidden relative flex-1 items-center min-w-0">
            <div className="flex whitespace-nowrap animate-marquee font-bold text-[#00b5a4] text-[10.5px] items-center">
              <div className="flex shrink-0 items-center gap-1.5 pr-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b5a4] animate-promo-pulse"></span>
                <span className="animate-promo-pulse">Free Delivery Eligible On Orders Above ₹{threshold}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 pr-4" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b5a4] animate-promo-pulse"></span>
                <span className="animate-promo-pulse">Free Delivery Eligible On Orders Above ₹{threshold}</span>
              </div>
            </div>
          </div>

          {/* Desktop static version */}
          <span className="hidden sm:inline-flex items-center gap-1.5 font-bold text-[#00b5a4] whitespace-nowrap text-[11px] md:text-[12.5px] lg:text-[13px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#00b5a4] animate-promo-pulse"></span>
            <span className="animate-promo-pulse">Free Delivery Eligible On Orders Above ₹{threshold}</span>
          </span>

          <LocalizedClientLink href="/shop" className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1 text-[9.5px] sm:text-[10.5px] md:text-[11px] rounded transition-all whitespace-nowrap shrink-0 min-w-max leading-none inline-flex items-center justify-center">
            Shop Now
          </LocalizedClientLink>
        </div>

        {/* Right Navigation Links */}
        <div className="hidden md:flex items-center justify-end gap-2.5 lg:gap-4 xl:gap-5 font-semibold text-gray-300 whitespace-nowrap text-[10.5px] md:text-[11.5px] lg:text-[12px] shrink-0 flex-1">
          <LocalizedClientLink href="/" className="hover:text-white transition-colors shrink-0">Home</LocalizedClientLink>
          <LocalizedClientLink href="/faq" className="hover:text-white transition-colors shrink-0">FAQ</LocalizedClientLink>
          <LocalizedClientLink href="/our-story" className="hover:text-white transition-colors shrink-0">Our Story</LocalizedClientLink>
          <LocalizedClientLink href="/contact" className="hover:text-white transition-colors shrink-0">Contact Us</LocalizedClientLink>
          <LocalizedClientLink href="/account" className="hover:text-white transition-colors shrink-0">
            {customer ? "Account" : "Log In"}
          </LocalizedClientLink>
        </div>
      </div>


      <nav style={styles.mainNav as any} className="flex bg-white dark:bg-[#111] border-b border-[#f3f4f6] dark:border-[#2d2d2d] shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none">
        <div className="flex items-center">
          <LocalizedClientLink href="/" className="flex items-center group">
            <img src="/images/logos/logo.png" alt="PRO" style={styles.logo} className="group-hover:scale-105" />
          </LocalizedClientLink>
        </div>

        <div style={styles.menu as any} className="hidden lg:flex">
          <LocalizedClientLink href="/shop" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px] text-black dark:text-gray-100 hover:text-black dark:hover:text-white">
            Shop All
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/shoe-care" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px] text-black dark:text-gray-100 hover:text-black dark:hover:text-white">
            Shoe Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/insoles" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px] text-black dark:text-gray-100 hover:text-black dark:hover:text-white">
            Insoles
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/foot-care" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px] text-black dark:text-gray-100 hover:text-black dark:hover:text-white">
            Foot Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/accessories" style={styles.menuLink} className="nav-item-animated group uppercase tracking-widest text-[13px] text-black dark:text-gray-100 hover:text-black dark:hover:text-white">
            Accessories
          </LocalizedClientLink>
        </div>

        <div style={styles.rightSection as any} className="flex">
          <div style={styles.searchContainer as any} className="flex group">
            <SearchModal />
          </div>

          <LocalizedClientLink href="/account" style={styles.icon} className="hidden md:flex hover:scale-110 text-black dark:text-gray-100">
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
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00b5a4] px-1 text-[10px] font-bold leading-none text-white">
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
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} customer={customer} />
          </div>
        </div>
      </nav>
    </div>
  )
}
