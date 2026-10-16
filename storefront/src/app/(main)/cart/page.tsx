import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import MetaCheckoutTracker from "@modules/checkout/components/meta-checkout-tracker"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSeoForPath } from "@lib/util/seo"

const cartSeo = getSeoForPath("/cart")

export const metadata: Metadata = {
  title: cartSeo?.title || "Shopping Cart | Pro Premium Care",
  description:
    cartSeo?.description ||
    "Review your selected shoe care products, check your shopping cart and prepare your order with Pro Premium Care.",
  keywords: cartSeo?.keywords
    ? cartSeo.keywords.split(",").map((k) => k.trim())
    : undefined,
}

export const dynamic = "force-dynamic"

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return (
    <>
      {cart && <MetaCheckoutTracker total={cart.total} currencyCode={cart.currency_code} />}
      <CartTemplate cart={cart} customer={customer} />
    </>
  )
}
