import { Heading } from "@medusajs/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <Heading
              level="h1"
              className="flex flex-col gap-y-2 text-ui-fg-base text-4xl font-black tracking-tighter"
            >
              <span>Order Confirmed!</span>
            </Heading>
            <p className="text-ui-fg-subtle mt-4 text-lg max-w-md">
              Your order has been placed successfully. We've sent a confirmation email to <span className="font-bold text-ui-fg-base">{order.email}</span>
            </p>
            <div className="flex gap-4 mt-10">
              <a 
                href={`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/orders/${order.id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="bg-zinc-100 text-black px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
              >
                Download Invoice
              </a>
              <a 
                href="/account/orders" 
                className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-200"
              >
                View My Orders
              </a>
            </div>
          </div>

          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
