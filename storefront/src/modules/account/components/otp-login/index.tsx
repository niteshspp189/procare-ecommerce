"use client"

import { useActionState, useState } from "react"
import { sendOTP, verifyOTP } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import ErrorMessage from "@modules/checkout/components/error-message"

type Props = {
  onBack: () => void
}

const OTPLogin = ({ onBack }: Props) => {
  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, formAction] = useActionState(verifyOTP, null)

  const handleSendOTP = async () => {
    if (!email) return
    setLoading(true)
    const result = await sendOTP(email)
    setLoading(false)
    if (result.message === "OTP sent successfully") {
      setOtpSent(true)
    }
  }

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      <h1 className="text-large-semi uppercase mb-6">Login with OTP</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email to receive a 6-digit login code.
      </p>
      
      {!otpSent ? (
        <div className="w-full">
          <Input
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full mt-6 bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      ) : (
        <form action={formAction} className="w-full">
          <input type="hidden" name="email" value={email} />
          <div className="flex flex-col w-full gap-y-2">
             <p className="text-small-regular text-ui-fg-base mb-2">
                OTP sent to <b>{email}</b>. 
                <button onClick={() => setOtpSent(false)} className="ml-2 underline">Change</button>
             </p>
            <Input
              label="6-Digit Code"
              name="code"
              type="text"
              required
              autoFocus
            />
          </div>
          <ErrorMessage error={message} />
          <SubmitButton className="w-full mt-6">Verify & Login</SubmitButton>
        </form>
      )}
      
      <button
        onClick={onBack}
        className="text-center text-ui-fg-base text-small-regular mt-6 underline"
      >
        Back to Password Login
      </button>
    </div>
  )
}

export default OTPLogin
