"use client"

export const META_PIXEL_ID = "1366811708930095"

export const trackMetaEvent = (eventName: string, options?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    const fire = () => {
      const fbq = (window as any).fbq
      if (typeof fbq === "function") {
        try {
          if (options) {
            fbq("track", eventName, options)
          } else {
            fbq("track", eventName)
          }
          console.log(`[Meta Pixel] Event fired: ${eventName}`, options)
          return true
        } catch (err) {
          console.error(`[Meta Pixel] Error firing event ${eventName}:`, err)
        }
      }
      return false
    }

    if (!fire()) {
      setTimeout(fire, 500)
      setTimeout(fire, 1500)
    }
  }
}

