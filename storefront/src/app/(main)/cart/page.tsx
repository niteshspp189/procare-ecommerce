import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import MetaCheckoutTracker from "@modules/checkout/components/meta-checkout-tracker"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
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
