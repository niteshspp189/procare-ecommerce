"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { trackMetaEvent } from "@lib/util/meta-pixel"

export default function MetaPixelPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // The base script in layout.tsx already fires the initial PageView.
    // We only want to fire it on subsequent route changes.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    trackMetaEvent("PageView")
  }, [pathname, searchParams])

  return null
}
