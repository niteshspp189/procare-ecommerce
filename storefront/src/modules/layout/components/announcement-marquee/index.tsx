"use client"

import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface AnnouncementMarqueeProps {
  announcements: string[]
  threshold: number
  shopNowLink?: string
}

export default function AnnouncementMarquee({
  announcements,
  threshold,
  shopNowLink = "/shop",
}: AnnouncementMarqueeProps) {
  // Format dynamic variables like {threshold}
  const formattedItems = (announcements && announcements.length > 0
    ? announcements
    : [
        "Free Delivery Eligible On Orders Above ₹{threshold}",
        "Rakhi offer: 5% off on all products on purchase of Rs 999, Use Code RAKHI5",
        "Glow this Rakhi: 5% Off on Magic Pedi. Use Code RAKHI5",
      ]
  ).map((text) => text.replace(/\{threshold\}/g, String(threshold)))

  return (
    <div className="flex items-center justify-between w-full max-w-full overflow-hidden relative">
      {/* Marquee Track container with overflow-hidden and pause-on-hover */}
      <div className="flex-1 overflow-hidden relative group cursor-default">
        <div className="flex whitespace-nowrap animate-marquee items-center text-[10.5px] sm:text-[11px] md:text-[12px] font-bold text-[#00b5a4] uppercase tracking-normal sm:tracking-wider">
          {/* First set of items */}
          <div className="flex shrink-0 items-center">
            {formattedItems.map((item, idx) => (
              <div key={`set1-${idx}`} className="flex items-center shrink-0 pr-6 sm:pr-8 md:pr-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b5a4] mr-2 animate-promo-pulse shrink-0"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Duplicate set of items for seamless infinite scroll */}
          <div className="flex shrink-0 items-center" aria-hidden="true">
            {formattedItems.map((item, idx) => (
              <div key={`set2-${idx}`} className="flex items-center shrink-0 pr-6 sm:pr-8 md:pr-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00b5a4] mr-2 animate-promo-pulse shrink-0"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shop Now CTA Button */}
      <div className="shrink-0 pl-2 sm:pl-3 z-10">
        <LocalizedClientLink
          href={shopNowLink}
          className="bg-white/10 hover:bg-white/20 text-white font-bold px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] md:text-[10.5px] rounded transition-all whitespace-nowrap leading-none inline-flex items-center justify-center border border-white/10"
        >
          Shop Now
        </LocalizedClientLink>
      </div>
    </div>
  )
}
