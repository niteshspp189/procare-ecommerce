"use client"

import React, { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CMSBanner, DEFAULT_HERO_BANNER } from "@lib/data/banners"

interface DynamicHeroBannerProps {
  banners?: CMSBanner[]
}

function getYouTubeId(url: string): string | null {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return match ? match[1] : null
}

function isDirectVideo(url: string): boolean {
  if (!url) return false
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

const DynamicHeroBanner: React.FC<DynamicHeroBannerProps> = ({ banners = [] }) => {
  // Support up to max 5 dynamic hero carousel slides
  const activeBanners = (banners.length > 0 ? banners : [DEFAULT_HERO_BANNER]).slice(0, 5)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentBanner = activeBanners[currentIndex] || activeBanners[0] || DEFAULT_HERO_BANNER
  const desktopSrc = currentBanner.desktop_image_url || DEFAULT_HERO_BANNER.desktop_image_url
  const mobileSrc = currentBanner.mobile_image_url || desktopSrc
  const linkHref = currentBanner.link_url || "/shop"
  const altText = currentBanner.alt_text || currentBanner.title || "Shop Pro Care Products"

  const youtubeId = getYouTubeId(desktopSrc) || getYouTubeId(mobileSrc)
  const hasDirectVideo = isDirectVideo(desktopSrc)

  // Auto rotation every 7 seconds, paused when hovering or playing video
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused || youtubeId) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [activeBanners.length, isPaused, youtubeId])

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length)
  }

  return (
    <section 
      className="relative w-full overflow-hidden bg-black group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full aspect-[390/520] sm:aspect-[16/7] md:aspect-[1600/583] max-h-[583px]">
        {youtubeId ? (
          <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`}
              title={altText}
              className="w-full h-[140%] min-h-full pointer-events-none scale-105"
              allow="autoplay; encrypted-media; picture-in-picture"
            />
            {linkHref && (
              <LocalizedClientLink
                href={linkHref}
                className="absolute inset-0 z-10 cursor-pointer"
                aria-label={altText}
              >
                <span className="sr-only">View Collection</span>
              </LocalizedClientLink>
            )}
            {linkHref && (
              <LocalizedClientLink
                href={linkHref}
                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-md transition-colors flex items-center gap-1.5"
              >
                Explore Collection →
              </LocalizedClientLink>
            )}
          </div>
        ) : hasDirectVideo ? (
          <LocalizedClientLink href={linkHref} className="block relative w-full h-full cursor-pointer">
            <video
              src={desktopSrc}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover object-top"
            />
          </LocalizedClientLink>
        ) : (
          <LocalizedClientLink
            href={linkHref}
            className="block relative overflow-hidden w-full h-full cursor-pointer"
          >
            <picture className="w-full h-full block">
              <source media="(max-width: 767px)" srcSet={mobileSrc} />
              <img
                src={desktopSrc}
                alt={altText}
                className="w-full h-full object-cover object-top block transition-transform duration-[5s] group-hover:scale-105"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          </LocalizedClientLink>
        )}
      </div>

      {/* Previous / Next Arrow Controls (if multiple slides) */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Carousel Navigation Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? "w-7 bg-[#d8fa00]" : "w-2 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default DynamicHeroBanner
