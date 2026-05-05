"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

type Props = {
  orderId: string
  token: string
}

const AutoLoginTrigger = ({ orderId, token }: Props) => {
  const router = useRouter()

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/auth/auto-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({ order_id: orderId, token }),
        })

        const result = await response.json()
        
        if (result.success) {
            console.log("Auto-login successful for:", result.email)
            // We refresh the page/router to ensure the layout reflects the logged-in state
            // In a full implementation, we'd also call a 'verifyOTP' or similar to set the cookie
            router.refresh()
        }
      } catch (error) {
        console.error("Auto-login failed:", error)
      }
    }

    if (orderId && token) {
      performAutoLogin()
    }
  }, [orderId, token, router])

  return null
}

export default AutoLoginTrigger
