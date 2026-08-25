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
import { getAnnouncements } from "@lib/data/announcements"
import AnnouncementMarquee from "@modules/layout/components/announcement-marquee"

export default async function Nav() {
  const [regions, locales, currentLocale, customer, thresholdData, announcements] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    retrieveCustomer().catch(() => null),
    getShippingThreshold(),
    getAnnouncements(),
  ])

  const threshold = thresholdData?.threshold ?? 499

  return (
    <div className="sticky top-0 inset-x-0 z-50 animate-fade-in">
      {/* Black Top bar for premium feel */}
      <div className="flex justify-between items-center px-2 sm:px-4 md:px-6 py-2 bg-[#141414] text-white uppercase tracking-normal sm:tracking-wider border-b border-gray-800 w-full max-w-full relative gap-2 sm:gap-4" style={{overflowX: 'clip', overflowY: 'visible'}}>
        
        {/* Dynamic Scrolling Announcements Marquee & Shop Now button */}
        <div className="flex-1 min-w-0">
          <AnnouncementMarquee
            announcements={announcements}
            threshold={threshold}
            shopNowLink="/shop"
          />
        </div>

        {/* Right Navigation Links */}
        <div className="hidden md:flex items-center justify-end gap-2.5 lg:gap-4 xl:gap-5 font-semibold text-gray-300 whitespace-nowrap text-[10.5px] md:text-[11px] lg:text-[11.5px] shrink-0 min-w-0">
          <LocalizedClientLink href="/" className="hover:text-white transition-colors shrink-0">Home</LocalizedClientLink>
          <LocalizedClientLink href="/faq" className="hover:text-white transition-colors shrink-0">FAQ</LocalizedClientLink>
          <LocalizedClientLink href="/our-story" className="hover:text-white transition-colors shrink-0">Our Story</LocalizedClientLink>
          <LocalizedClientLink href="/contact" className="hover:text-white transition-colors shrink-0">Contact Us</LocalizedClientLink>
          <LocalizedClientLink href="/account" className="hover:text-white transition-colors shrink-0">
            {customer ? "Account" : "Log In"}
          </LocalizedClientLink>
        </div>
      </div>

      <nav className="flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-white dark:bg-[#111] border-b border-[#f3f4f6] dark:border-[#2d2d2d] shadow-[0_4px_15px_rgba(0,0,0,0.03)] dark:shadow-none relative z-40 w-full">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <LocalizedClientLink href="/" className="flex items-center group">
            <img src="/images/logos/logo.png" alt="PRO" className="h-6 sm:h-7 w-auto block group-hover:scale-105 transition-transform" />
          </LocalizedClientLink>
        </div>

        {/* Center Desktop Navigation Menu */}
        <div className="hidden lg:flex items-center gap-6 xl:gap-8">
          <LocalizedClientLink href="/shop" className="nav-item-animated group uppercase tracking-widest text-[13px] font-semibold text-black dark:text-gray-100 hover:text-black dark:hover:text-white flex items-center gap-1">
            Shop All
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/shoe-care" className="nav-item-animated group uppercase tracking-widest text-[13px] font-semibold text-black dark:text-gray-100 hover:text-black dark:hover:text-white flex items-center gap-1">
            Shoe Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/insoles" className="nav-item-animated group uppercase tracking-widest text-[13px] font-semibold text-black dark:text-gray-100 hover:text-black dark:hover:text-white flex items-center gap-1">
            Insoles
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/foot-care" className="nav-item-animated group uppercase tracking-widest text-[13px] font-semibold text-black dark:text-gray-100 hover:text-black dark:hover:text-white flex items-center gap-1">
            Foot Care
          </LocalizedClientLink>
          <LocalizedClientLink href="/categories/accessories" className="nav-item-animated group uppercase tracking-widest text-[13px] font-semibold text-black dark:text-gray-100 hover:text-black dark:hover:text-white flex items-center gap-1">
            Accessories
          </LocalizedClientLink>
        </div>

        {/* Right Section: Search, Wishlist/Account, Cart, Mobile Hamburger */}
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-5 shrink-0">
          <div className="flex group">
            <SearchModal />
          </div>

          <LocalizedClientLink href="/account" className="hidden md:flex items-center hover:scale-110 text-black dark:text-gray-100 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </LocalizedClientLink>

          <div className="flex items-center">
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="group flex items-center"
                  href="/cart"
                  aria-label="Cart (0)"
                >
                  <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors duration-200 group-hover:bg-gray-100">
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

          {/* Mobile Hamburger Side Menu */}
          <div className="flex lg:hidden items-center ml-0.5 sm:ml-1">
            <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} customer={customer} />
          </div>
        </div>
      </nav>
    </div>
  )
}
