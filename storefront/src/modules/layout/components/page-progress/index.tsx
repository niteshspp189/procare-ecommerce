"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function PageProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // 1. Reset progress when navigation completes
  useEffect(() => {
    if (loading) {
      setProgress(100)
      const timer = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  // 2. Global click listener to start progress immediately
  useEffect(() => {
    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const anchor = target.closest("a")

      if (
        anchor && 
        anchor instanceof HTMLAnchorElement &&
        anchor.href &&
        anchor.target !== "_blank" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey &&
        anchor.href.startsWith(window.location.origin) &&
        anchor.href !== window.location.href // Don't trigger for same page
      ) {
        // Start progress
        setLoading(true)
        setProgress(10)
        
        // Slowly increment to simulate activity
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(interval)
              return 90
            }
            return prev + 5
          })
        }, 200)

        // Cleanup interval if needed
        return () => clearInterval(interval)
      }
    }

    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 w-full z-[10000] pointer-events-none">
      <div 
        className="h-[3px] bg-[#00bda5] transition-all duration-300 ease-out shadow-[0_0_10px_#00bda5,0_0_5px_#00bda5]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
