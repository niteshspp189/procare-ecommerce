"use client"

import { isManual, isRazorpay, isStripeLike } from "@lib/constants"
import { placeOrder, updatePaymentSession } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useEffect, useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isRazorpay(paymentSession?.provider_id):
      return (
        <RazorpayPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return (
        <div className="flex justify-end">
          <Button 
            disabled 
            className="bg-[#00bda5] opacity-50 hover:bg-[#00bda5] text-white border-none min-w-[200px]"
          >
            Pay Now
          </Button>
        </div>
      )
  }
}

const RazorpayPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = async () => {
    setSubmitting(true)

    if (!session || !cart) {
      setSubmitting(false)
      return
    }

    const loadScript = (src: string) => {
      return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
    }

    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js")

    if (!res) {
      setErrorMessage("Razorpay SDK failed to load. Are you online?")
      setSubmitting(false)
      return
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: cart.total * 100, // Amount is in currency subunits
      currency: cart.region?.currency_code.toUpperCase(),
      name: "ProCare Store",
      description: `Order ${cart.id}`,
      order_id: session.data.id,
      handler: async function (response: any) {
        await updatePaymentSession(cart.id, {
          provider_id: session.provider_id,
          data: {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          },
        })
        onPaymentCompleted()
      },
      prefill: {
        name: `${cart.billing_address?.first_name} ${cart.billing_address?.last_name}`,
        email: cart.email,
        contact: cart.billing_address?.phone,
      },
      notes: {
        address: cart.billing_address?.address_1,
      },
      theme: {
        color: "#00bda5",
      },
    }

    const rzp1 = new (window as any).Razorpay(options)
    rzp1.on("payment.failed", function (response: any) {
      setErrorMessage(response.error.description)
      setSubmitting(false)
    })
    rzp1.open()
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        disabled={notReady}
        onClick={handlePayment}
        size="large"
        className="bg-[#00bda5] hover:bg-[#008c7a] text-white border-none min-w-[200px]"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Pay Now
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="razorpay-payment-error-message"
      />
    </div>
  )
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        className="bg-[#00bda5] hover:bg-[#008c7a] text-white border-none min-w-[200px]"
        isLoading={submitting}
        data-testid={dataTestId}
      >
        Pay Now
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </div>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()
  }

  return (
    <div className="flex flex-col items-end">
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
        className="bg-[#00bda5] hover:bg-[#008c7a] text-white border-none min-w-[200px]"
        data-testid="submit-order-button"
      >
        Pay Now
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </div>
  )
}

export default PaymentButton
