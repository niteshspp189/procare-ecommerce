"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function PageProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When path changes, trigger a quick "fake" progress bar
    setLoading(true)
    setProgress(30)
    
    const timer = setTimeout(() => {
      setProgress(100)
      const hideTimer = setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 400)
      return () => clearTimeout(hideTimer)
    }, 500)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 w-full z-[10000] pointer-events-none">
      <div 
        className="h-[3px] bg-[#00bda5] transition-all duration-500 ease-out shadow-[0_0_10px_#00bda5,0_0_5px_#00bda5]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
