import { Container, Heading, Text } from "@medusajs/ui"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Payment
      </Heading>
      <div>
        {payment && (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method"
                >
                  {((order as any).metadata?.payment_mode === "partial_cod" || (payment as any).data?.is_partial)
                    ? "Partial COD (Advance Paid Online + Balance on Delivery)"
                    : (paymentInfoMap[payment.provider_id]?.title || "Online Payment")}
                </Text>
              </div>
              <div className="flex flex-col w-2/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[payment.provider_id]?.icon}
                  </Container>
                  <Text data-testid="payment-amount">
                    {isStripeLike(payment.provider_id) && payment.data?.card_last4
                      ? `**** **** **** ${payment.data.card_last4}`
                      : `${convertToLocale({
                          amount: ((order as any).metadata?.advance_paid) ? Number((order as any).metadata.advance_paid) : payment.amount,
                          currency_code: order.currency_code,
                        })} paid online at ${new Date(
                          payment.created_at ?? ""
                        ).toLocaleString()}`}
                  </Text>
                </div>
              </div>
            </div>

            {((order as any).metadata?.payment_mode === "partial_cod" || (payment as any).data?.is_partial) && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-900 block text-sm">
                    🚚 Balance Due on Doorstep Delivery
                  </span>
                  <span className="text-emerald-700">
                    Our delivery courier will collect this remaining balance via Cash or UPI when delivering your order.
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-extrabold text-emerald-950 font-mono">
                    ₹{Number((order as any).metadata?.cod_balance || 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
