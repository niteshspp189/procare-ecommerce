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

  return (
    <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '10px',
        zIndex: 9999,
        fontSize: '13px',
        fontFamily: 'monospace',
        border: '1px solid #444',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
        <b>AutoLogin:</b> {status}
    </div>
  )
}

export default AutoLoginTrigger
