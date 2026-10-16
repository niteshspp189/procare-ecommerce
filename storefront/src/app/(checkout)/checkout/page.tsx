import { retrieveCart, checkAndAutoApplyFestive5 } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import MetaCheckoutTracker from "@modules/checkout/components/meta-checkout-tracker"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
}

export const dynamic = "force-dynamic"

export default async function Checkout() {
  let cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // Pre-flight check: If subtotal >= 999 and FESTIVE5 isn't applied yet, apply and reload
  const subtotal = cart.items?.reduce((acc: number, item: any) => {
    return acc + (item.total ?? ((item.unit_price || 0) * (item.quantity || 1)))
  }, 0) ?? 0
  const hasFestive5 = cart.promotions?.some((p: any) => p.code?.toUpperCase() === "FESTIVE5")
  if (subtotal >= 999 && !hasFestive5) {
    await checkAndAutoApplyFestive5(cart.id)
    cart = await retrieveCart() || cart
  }

  const customer = await retrieveCustomer()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] content-container gap-8 lg:gap-x-16 py-8 lg:py-12">
      <MetaCheckoutTracker total={cart.total} currencyCode={cart.currency_code} />
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
