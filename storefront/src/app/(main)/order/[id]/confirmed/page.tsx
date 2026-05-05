import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@modules/order/templates/order-completed-template"
import AutoLoginTrigger from "@modules/order/components/auto-login"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}
export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const autoLoginToken = order.metadata?.auto_login_token as string

  return (
    <>
      {autoLoginToken && (
        <AutoLoginTrigger orderId={order.id} token={autoLoginToken} />
      )}
      <OrderCompletedTemplate order={order} />
    </>
  )
}
