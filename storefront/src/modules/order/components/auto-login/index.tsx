"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { autoLogin } from "@lib/data/customer"

console.log("AutoLoginTrigger: File loaded")

type Props = {
  orderId: string
  token?: string
}

const AutoLoginTrigger = ({ orderId, token }: Props) => {
  const router = useRouter()
  const [status, setStatus] = useState<string | null>("Initializing...")
  const [visible, setVisible] = useState(true)
  const maxAttempts = 5

  useEffect(() => {
    if (!token) {
      setVisible(false)
      setStatus(null)
      return
    }

    let isMounted = true
    let interval: NodeJS.Timeout | null = null

    console.log("AutoLoginTrigger: Mounted for orderId:", orderId)

    const performAutoLogin = async (currentAttempt: number) => {
      if (!isMounted) return false
      setStatus(`Attempt ${currentAttempt}/${maxAttempts}...`)

      try {
        const result = await autoLogin(orderId, token || "")

        if (result.success) {
          if (isMounted) {
            setStatus("SUCCESS! Refreshing...")
            router.refresh()
          }
          return true
        } else {
          const res = result as any
          if (isMounted) {
            setStatus(`Failed: ${res.error || res.message || "Unknown error"}`)
          }
          return false
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus(`Error: ${err.message}`)
        }
        return false
      }
    }

    const startPolling = async () => {
      let currentAttempt = 1
      const success = await performAutoLogin(currentAttempt)
      if (success || !isMounted) return

      interval = setInterval(async () => {
        currentAttempt++
        if (currentAttempt > maxAttempts) {
          if (isMounted) {
            setStatus("Failed after max attempts")
          }
          if (interval) clearInterval(interval)
          return
        }

        const success = await performAutoLogin(currentAttempt)
        if (success) {
          if (interval) clearInterval(interval)
        }
      }, 3000)
    }

    startPolling()

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [orderId, token, router])

  // Automatically hide popup after 5 seconds if it fails or hits max attempts
  useEffect(() => {
    if (status && (status.includes("Failed") || status.includes("Error"))) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!visible || status === null || status.includes("SUCCESS")) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-black/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 ring-1 ring-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">System Process</span>
          <span className="text-sm font-semibold tracking-tight">{status}</span>
        </div>
        <div className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              status.includes("Failed") || status.includes("Error") ? "bg-amber-400" : "bg-green-400"
            } opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              status.includes("Failed") || status.includes("Error") ? "bg-amber-500" : "bg-green-500"
            }`}
          ></span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-1 text-white/50 hover:text-white transition-colors text-xs p-1"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default AutoLoginTrigger
