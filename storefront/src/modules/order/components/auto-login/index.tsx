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
  const [status, setStatus] = useState("Initializing...")
  const [attempt, setAttempt] = useState(0)
  const maxAttempts = 5

  useEffect(() => {
    console.log("AutoLoginTrigger: Mounted for orderId:", orderId)
    
    const performAutoLogin = async (currentAttempt: number) => {
      setAttempt(currentAttempt)
      setStatus(`Attempt ${currentAttempt}/${maxAttempts}...`)
      
      try {
        const result = await autoLogin(orderId, token || "")
        
        if (result.success) {
            setStatus("SUCCESS! Refreshing...")
            router.refresh()
            return true
        } else {
            const res = result as any
            setStatus(`Failed: ${res.error || res.message || "Unknown error"}`)
            return false
        }
      } catch (err: any) {
        setStatus(`Error: ${err.message}`)
        return false
      }
    }

    const startPolling = async () => {
        let currentAttempt = 1
        const success = await performAutoLogin(currentAttempt)
        if (success) return

        const interval = setInterval(async () => {
            currentAttempt++
            if (currentAttempt > maxAttempts) {
                setStatus("Failed after max attempts")
                clearInterval(interval)
                return
            }
            
            const success = await performAutoLogin(currentAttempt)
            if (success) {
                clearInterval(interval)
            }
        }, 3000)

        return () => clearInterval(interval)
    }

    startPolling()
  }, [orderId, token, router])

  if (status === null || status.includes("SUCCESS")) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/10 ring-1 ring-white/5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black">System Process</span>
          <span className="text-sm font-semibold tracking-tight">{status}</span>
        </div>
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </div>
      </div>
    </div>
  )
}

export default AutoLoginTrigger
