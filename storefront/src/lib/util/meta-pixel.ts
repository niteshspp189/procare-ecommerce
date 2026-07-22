"use client"

export const META_PIXEL_ID = "1366811708930095"

export const trackMetaEvent = (eventName: string, options?: Record<string, any>) => {
  if (typeof window !== "undefined" && (window as any).fbq) {
    try {
      if (options) {
        ;(window as any).fbq("track", eventName, options)
      } else {
        ;(window as any).fbq("track", eventName)
      }
    } catch (err) {
      console.error("Error firing Meta Pixel event:", err)
    }
  }
}
