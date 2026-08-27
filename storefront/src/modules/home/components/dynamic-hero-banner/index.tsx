"use client"

import React, { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CMSBanner, DEFAULT_HERO_BANNER } from "@lib/data/banners"

interface DynamicHeroBannerProps {
  banners?: CMSBanner[]
}

const DynamicHeroBanner: React.FC<DynamicHeroBannerProps> = ({ banners = [] }) => {
  const activeBanners = banners.length > 0 ? banners : [DEFAULT_HERO_BANNER]
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (activeBanners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [activeBanners.length])

  const currentBanner = activeBanners[currentIndex] || activeBanners[0] || DEFAULT_HERO_BANNER
  const desktopSrc = currentBanner.desktop_image_url || DEFAULT_HERO_BANNER.desktop_image_url
  const mobileSrc = currentBanner.mobile_image_url || desktopSrc
  const linkHref = currentBanner.link_url || "/shop"
  const altText = currentBanner.alt_text || currentBanner.title || "Shop Pro Care Products"

  return (
    <section className="relative w-full overflow-hidden bg-white group">
      <LocalizedClientLink
        href={linkHref}
        className="block relative overflow-hidden w-full bg-white cursor-pointer"
      >
        <picture className="w-full h-auto block">
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
          <img
            src={desktopSrc}
            alt={altText}
            className="w-full h-auto object-contain block transition-transform duration-[5s] group-hover:scale-105"
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </LocalizedClientLink>

      {/* Carousel Navigation Indicators (if multiple banners) */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default DynamicHeroBanner
