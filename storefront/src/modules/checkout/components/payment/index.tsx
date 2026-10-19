"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap, isManual } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import PaymentButton from "@modules/checkout/components/payment-button"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const filteredPaymentMethods = (availablePaymentMethods ?? []).filter(
    (method: any) => method.id !== "manual" && method.id !== "pp_system_default"
  )

  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const [isServiceable, setIsServiceable] = useState<boolean | null>(null)
  const [checkingServiceability, setCheckingServiceability] = useState(false)
  const [pincodeChecked, setPincodeChecked] = useState<string | null>(null)

  const postalCode = cart?.shipping_address?.postal_code

  const emailVal = cart?.email || ""
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)

  const phoneVal = cart?.shipping_address?.phone || ""
  const cleanPhone = phoneVal.replace(/\D/g, "")
  const strippedPhone = (cleanPhone.startsWith("91") && cleanPhone.length > 10) ? cleanPhone.slice(2) : cleanPhone
  const isPhoneValid = strippedPhone.length === 10

  useEffect(() => {
    const checkPostcode = async () => {
      if (!postalCode || pincodeChecked === postalCode) return
      
      setCheckingServiceability(true)
      setPincodeChecked(postalCode)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
        const response = await fetch(`${backendUrl}/store/shiprocket/check-serviceability?pincode=${postalCode}`)
        if (response.ok) {
          const result = await response.json()
          setIsServiceable(result?.serviceable !== false)
        } else {
          setIsServiceable(true)
        }
      } catch (e) {
        console.warn("Failed to check Shiprocket serviceability:", e)
        setIsServiceable(true)
      } finally {
        setCheckingServiceability(false)
      }
    }

    if (isOpen && postalCode) {
      checkPostcode()
    }
  }, [isOpen, postalCode, pincodeChecked])

  const [partialConfig, setPartialConfig] = useState<{
    enabled: boolean
    percentage: number
    min_order_value: number
    label: string
  }>({
    enabled: true,
    percentage: 15,
    min_order_value: 0,
    label: "Partial COD (Pay 15% Online + 85% on Delivery)",
  })
  const [isPartialPayment, setIsPartialPayment] = useState(
    Boolean(activeSession?.data?.is_partial || activeSession?.data?.payment_mode === "partial_cod")
  )

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://propremiumcare.com/store-backend"
        const res = await fetch(`${backendUrl}/store/custom/partial-payment`)
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.config) {
            setPartialConfig(data.config)
          }
        }
      } catch (e) {
        // Fallback default
      }
    }
    fetchConfig()
  }, [])

  const cartTotal = Math.round(cart?.total || 0)
  const partialPct = partialConfig.percentage || 15
  const advanceAmount = Math.round((cartTotal * partialPct) / 100)
  const balanceCodAmount = Math.max(0, cartTotal - advanceAmount)
  const isPartialEligible = Boolean(
    partialConfig.enabled && cartTotal >= (partialConfig.min_order_value || 0)
  )

  const setPaymentMethod = async (method: string, partial: boolean = isPartialPayment) => {
    setError(null)
    setSelectedPaymentMethod(method)
    
    // Initiate session with partial or full payment data
    await initiatePaymentSession(cart, {
      provider_id: method,
      data: partial
        ? {
            is_partial: true,
            partial_percentage: partialPct,
            advance_paid: advanceAmount,
            cod_balance: balanceCodAmount,
            payment_mode: "partial_cod",
          }
        : {
            is_partial: false,
            payment_mode: "prepaid",
          },
    })
  }

  const handleTogglePartialPayment = async (partial: boolean) => {
    setIsPartialPayment(partial)
    const method = selectedPaymentMethod || filteredPaymentMethods[0]?.id || "pp_razorpay_razorpay"
    await setPaymentMethod(method, partial)
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Auto-select first payment method if none selected and we are in payment step
  useEffect(() => {
    if (isOpen && !selectedPaymentMethod && filteredPaymentMethods?.length) {
      const firstMethod = filteredPaymentMethods[0].id
      setPaymentMethod(firstMethod)
    }
  }, [isOpen, filteredPaymentMethods, selectedPaymentMethod])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Payment
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {checkingServiceability && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm animate-pulse">
              <p className="font-bold flex items-center gap-x-2">
                <span>ℹ️</span> Verifying Shipping Details...
              </p>
              <p className="mt-1">
                Checking delivery serviceability for pincode <strong>{postalCode}</strong> with our courier partner.
              </p>
            </div>
          )}

          {!checkingServiceability && isServiceable === true && isPhoneValid && isEmailValid && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
              <p className="font-bold flex items-center gap-x-2 mb-1">
                <span>✅</span> Details Verified & Deliverable
              </p>
              <p>
                Your delivery pincode <strong>{postalCode}</strong> and contact details are verified and serviceable by our courier partners.
              </p>
            </div>
          )}

          {!checkingServiceability && (isServiceable === false || !isPhoneValid || !isEmailValid) && (
            <div className="mb-6 p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
              <p className="font-bold flex items-center gap-x-2 mb-1">
                <span>⚠️</span> Delivery Review Required
              </p>
              <p>
                We found potential delivery or courier routing items:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 font-medium">
                {isServiceable === false && (
                  <li>Our courier partner (Shiprocket) indicates that the pincode <strong>{postalCode}</strong> has serviceability limitations or might require custom routing.</li>
                )}
                {!isPhoneValid && (
                  <li>Your phone number (<strong>{phoneVal}</strong>) must be exactly 10 digits (excluding +91). Currently it has {strippedPhone.length} digits.</li>
                )}
                {!isEmailValid && (
                  <li>Your email address (<strong>{emailVal}</strong>) format appears to be invalid or incomplete.</li>
                )}
              </ul>
              <p className="mt-3">
                <strong>Don't worry!</strong> You can still complete your payment and place the order. We will manually correct this address or contact you after payment is received.
              </p>
            </div>
          )}
          {!paidByGiftcard && filteredPaymentMethods?.length && (
            <>
              {isPartialEligible && (
                <div className="mb-6 space-y-3">
                  <Text className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Choose Payment Option:
                  </Text>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: 100% Online Payment */}
                    <div
                      onClick={() => handleTogglePartialPayment(false)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        !isPartialPayment
                          ? "border-black bg-gray-50 shadow-xs ring-1 ring-black"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-gray-900">
                            100% Online Payment
                          </span>
                          <span className="text-xs font-semibold text-gray-700 font-mono">
                            ₹{cartTotal}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Pay entire order amount online via UPI, Cards, or NetBanking for zero-contact delivery.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>Pay Online Now:</span>
                        <span className="font-bold text-black font-mono">₹{cartTotal}</span>
                      </div>
                    </div>

                    {/* Option 2: Partial COD */}
                    <div
                      onClick={() => handleTogglePartialPayment(true)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isPartialPayment
                          ? "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-600"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-emerald-900">
                            Partial COD ({partialPct}% Online)
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Pay small {partialPct}% advance to confirm dispatch. Remaining balance collected at your doorstep.
                        </p>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-emerald-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-900">
                          <span>Pay Online Now ({partialPct}%):</span>
                          <span className="font-mono">₹{advanceAmount}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600 font-medium">
                          <span>Pay on Delivery (Cash/UPI):</span>
                          <span className="font-mono">₹{balanceCodAmount}</span>
                        </div>
                        <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-800 font-medium">
                          <span>Advance Payment:</span>
                          <span className="font-semibold text-amber-900">Non-Refundable (T&C Apply)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isPartialPayment && (
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5">⚠️</span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-amber-950">
                          Advance Payment Policy (Non-Refundable):
                        </p>
                        <p className="text-amber-800 text-[11.5px] leading-relaxed">
                          The {partialPct}% online advance payment is non-refundable once the order is confirmed and dispatched. The remaining balance of ₹{balanceCodAmount} will be collected upon doorstep delivery via Cash or UPI. Terms & conditions apply.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Text className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Payment Gateway:
              </Text>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {filteredPaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <div className="mt-8">
            <PaymentButton cart={cart} data-testid="submit-order-button" />
          </div>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment method
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Payment details
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Another step will appear"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
