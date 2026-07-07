"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Fragment } from "react"
import { useParams } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Locale } from "@lib/data/locales"
import { signout } from "@lib/data/customer"

const SideMenuItems = {
  Home: "/",
  "Shop All": "/shop",
  "Shoe Care": "/categories/shoe-care",
  Insoles: "/categories/insoles",
  "Foot Care": "/categories/foot-care",
  Accessories: "/categories/accessories",
  "Our Story": "/our-story",
}

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  customer: HttpTypes.StoreCustomer | null
}

const SideMenu = ({ regions, locales, currentLocale, customer }: SideMenuProps) => {
  const { countryCode } = useParams() as { countryCode: string }

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  {/* Hamburger Icon - always visible */}
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/50 backdrop-blur-sm"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0 translate-x-[-100%]"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 translate-x-[-100%]"
              >
                <PopoverPanel className="flex flex-col fixed inset-y-0 left-0 w-full sm:w-80 lg:w-96 z-[51] text-sm text-ui-fg-on-color">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-black/95 backdrop-blur-xl justify-between p-6 overflow-y-auto"
                  >
                    <div className="flex justify-end items-center" id="xmark">
                      <button data-testid="close-menu-button" onClick={close} className="text-white hover:text-gray-300">
                        <XMark />
                      </button>
                    </div>
                    <ul className="flex flex-col gap-4 items-start justify-start mt-8">
                      {Object.entries(SideMenuItems).map(([name, href]) => {
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              className="text-xl sm:text-2xl font-bold leading-8 hover:text-gray-400 transition-colors"
                              onClick={close}
                              data-testid={`${name.toLowerCase().replace(/\s+/g, "-")}-link`}
                            >
                              {name}
                            </LocalizedClientLink>
                          </li>
                        )
                      })}

                      {/* Divider and Account Links */}
                      <li className="w-full border-t border-gray-800 my-2" />

                      {customer ? (
                        <>
                          <li className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-2 mb-1">
                            My Account
                          </li>
                          <li>
                            <LocalizedClientLink
                              href="/account"
                              className="text-xl font-bold leading-8 text-white hover:text-gray-400 transition-colors"
                              onClick={close}
                            >
                              Overview
                            </LocalizedClientLink>
                          </li>
                          <li>
                            <LocalizedClientLink
                              href="/account/profile"
                              className="text-xl font-bold leading-8 text-white hover:text-gray-400 transition-colors"
                              onClick={close}
                            >
                              Profile
                            </LocalizedClientLink>
                          </li>
                          <li>
                            <LocalizedClientLink
                              href="/account/addresses"
                              className="text-xl font-bold leading-8 text-white hover:text-gray-400 transition-colors"
                              onClick={close}
                            >
                              Addresses
                            </LocalizedClientLink>
                          </li>
                          <li>
                            <LocalizedClientLink
                              href="/account/orders"
                              className="text-xl font-bold leading-8 text-white hover:text-gray-400 transition-colors"
                              onClick={close}
                            >
                              Orders
                            </LocalizedClientLink>
                          </li>
                          <li className="mt-2">
                            <button
                              onClick={async () => {
                                await signout(countryCode)
                                close()
                              }}
                              className="text-xl font-bold leading-8 text-[#0bb799] hover:text-[#09a086] transition-colors text-left"
                            >
                              Log out
                            </button>
                          </li>
                        </>
                      ) : (
                        <li>
                          <LocalizedClientLink
                            href="/account"
                            className="text-xl sm:text-2xl font-bold leading-8 hover:text-gray-400 transition-colors"
                            onClick={close}
                          >
                            Log In
                          </LocalizedClientLink>
                        </li>
                      )}
                    </ul>
                    <div>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
