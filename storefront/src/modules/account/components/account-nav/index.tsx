"use client"

import { clx } from "@medusajs/ui"
import { ArrowRightOnRectangle } from "@medusajs/icons"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import User from "@modules/common/icons/user"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="small:hidden mb-6" data-testid="mobile-account-nav">
        <div 
          className="flex items-center justify-start overflow-x-auto flex-nowrap gap-x-2 pb-3 border-b border-gray-100 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx global>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <LocalizedClientLink
            href="/account"
            className={clx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider flex-shrink-0",
              (route === `/${countryCode}/account` || route === "/account")
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            Overview
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/orders"
            className={clx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider flex-shrink-0",
              route.includes("/account/orders")
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            Orders
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/profile"
            className={clx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider flex-shrink-0",
              route.includes("/account/profile")
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            Profile
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/addresses"
            className={clx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider flex-shrink-0",
              route.includes("/account/addresses")
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            Addresses
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/account/support"
            className={clx(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider flex-shrink-0",
              route.includes("/account/support")
                ? "bg-[#00b5a4] text-white border-[#00b5a4]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            )}
          >
            Support
          </LocalizedClientLink>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all border uppercase tracking-wider bg-white text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
          >
            Log out
          </button>
        </div>
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div>
          <div className="pb-4">
            <h3 className="text-base-semi">Account</h3>
          </div>
          <div className="text-base-regular">
            <ul className="flex mb-0 justify-start items-start flex-col gap-y-4">
              <li>
                <AccountNavLink
                  href="/account"
                  route={route!}
                  data-testid="overview-link"
                >
                  Overview
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/orders"
                  route={route!}
                  data-testid="orders-link"
                >
                  Orders
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/profile"
                  route={route!}
                  data-testid="profile-link"
                >
                  Profile
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/addresses"
                  route={route!}
                  data-testid="addresses-link"
                >
                  Addresses
                </AccountNavLink>
              </li>
              <li>
                <AccountNavLink
                  href="/account/support"
                  route={route!}
                  data-testid="support-link"
                >
                  Support / Complaints
                </AccountNavLink>
              </li>
              <li className="text-grey-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="logout-button"
                >
                  Log out
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx("text-ui-fg-subtle hover:text-ui-fg-base", {
        "text-ui-fg-base font-semibold": active,
      })}
      data-testid={dataTestId}
    >
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
