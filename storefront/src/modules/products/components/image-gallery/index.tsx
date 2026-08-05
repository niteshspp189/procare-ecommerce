"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  discountPercentage?: number
}

const getFormattedUrl = (url: string) => {
  let formattedUrl = url || "/images/polish.jpeg"
  if (!formattedUrl.startsWith("http") && !formattedUrl.startsWith("/")) {
    formattedUrl = "/" + formattedUrl
  }
  return encodeURI(formattedUrl)
}

// ─── Per-image zoom wrapper ────────────────────────────────────────────────────
type GalleryImageProps = {
  image: HttpTypes.StoreProductImage
  index: number
  isMobile: boolean
  isActive: boolean
  discountPercentage?: number
  zoomRef: (ref: ReactZoomPanPinchRef | null) => void
}

const GalleryImage = ({ image, index, isMobile, isActive, discountPercentage, zoomRef }: GalleryImageProps) => {
  const [scale, setScale] = useState(1)

  // On mobile at scale=1: panning disabled → touch events propagate to parent
  // so the snap-container can receive the horizontal swipe.
  // At scale > 1: panning enabled → user can pan within the zoomed image.
  const panDisabled = isMobile && scale <= 1

  return (
    <div
      id={`gallery-img-${image.id}`}
      className="relative aspect-square w-full flex-shrink-0 snap-center lg:snap-align-none overflow-hidden bg-white solid-box animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Discount badge */}
      {(discountPercentage ?? 0) > 0 && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-emerald-600 text-white text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-20">
          {discountPercentage}% OFF
        </div>
      )}



      {!!image.url && (
        <TransformWrapper
          ref={zoomRef}
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit
          limitToBounds
          onTransformed={(_: any, state: any) => setScale(state.scale)}
          panning={{
            disabled: panDisabled,
            velocityDisabled: true,
          }}
          wheel={{
            disabled: isMobile,
            step: 0.15,
          }}
          doubleClick={{
            mode: "toggle",         // toggle between 1× and 2.5×
            step: 1.5,
            animationTime: 250,
            animationType: "easeInOutCubic",
          }}
          pinch={{
            step: 8,
            disabled: false,
          }}
        >
          <TransformComponent
            wrapperClass="!w-full !h-full"
            contentClass="!w-full !h-full relative"
            // On mobile at scale=1: allow horizontal pan-x so swipe reaches parent
            wrapperProps={panDisabled ? { style: { touchAction: "pan-x" } } : {}}
          >
            <Image
              src={getFormattedUrl(image.url)}
              priority={index === 0}
              className="absolute inset-4 md:inset-8 object-contain z-10"
              alt={`Product image ${index + 1}`}
              fill
              sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
              unoptimized={true}
            />
          </TransformComponent>
        </TransformWrapper>
      )}

      {/* Zoom hint — desktop */}
      {!isMobile && scale <= 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur text-xs font-semibold px-4 py-2 rounded-full shadow-md text-gray-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center gap-2 z-10 border border-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          Double-click or scroll to zoom
        </div>
      )}

      {/* Zoom hint — mobile, only on active image when not zoomed */}
      {isMobile && isActive && scale <= 1 && (
        <div className="absolute bottom-3 right-3 bg-black/40 text-white text-[10px] font-medium px-2.5 py-1 rounded-full pointer-events-none z-10 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Pinch to zoom
        </div>
      )}

      {/* Reset zoom button when zoomed in */}
      {scale > 1 && (
        <div className="absolute top-3 right-3 z-20">
          {/* visual indicator only — tapping image resets via doubleClick toggle */}
          <div className="bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            {isMobile ? "Pinch or double-tap to reset" : "Double-click to reset"}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main gallery ──────────────────────────────────────────────────────────────
const ImageGallery = ({ images, discountPercentage }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const zoomRefs = useRef<(ReactZoomPanPinchRef | null)[]>([])

  // Detect viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── IntersectionObserver: highlight thumbnail as user swipes/scrolls ──────
  useEffect(() => {
    const container = document.getElementById("main-gallery-container")
    if (!container || images.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0
        let bestIdx = -1
        entries.forEach((entry) => {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio
            const idx = images.findIndex(
              (img) => `gallery-img-${img.id}` === entry.target.id
            )
            if (idx !== -1) bestIdx = idx
          }
        })
        if (bestIdx !== -1 && bestRatio >= 0.45) setActiveIndex(bestIdx)
      },
      {
        root: container,
        threshold: [0.45, 0.55, 0.75, 1.0],
      }
    )

    images.forEach((img) => {
      const el = document.getElementById(`gallery-img-${img.id}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [images])

  // ── Desktop thumbnail click ────────────────────────────────────────────────
  const handleDesktopThumb = useCallback(
    (image: HttpTypes.StoreProductImage, index: number) => {
      const container = document.getElementById("main-gallery-container")
      const el = document.getElementById(`gallery-img-${image.id}`)
      if (container && el) {
        // 1. Scroll main page to top (so user sees image + product title)
        window.scrollTo({ top: 0, behavior: "smooth" })
        // 2. After page scroll starts, scroll the gallery panel to the image
        setTimeout(() => {
          container.scrollTo({ top: el.offsetTop, behavior: "smooth" })
        }, 80)
      }
      setActiveIndex(index)
    },
    []
  )

  // ── Mobile thumbnail click ─────────────────────────────────────────────────
  const handleMobileThumb = useCallback(
    (image: HttpTypes.StoreProductImage, index: number) => {
      const container = document.getElementById("main-gallery-container")
      const el = document.getElementById(`gallery-img-${image.id}`)
      if (container && el) {
        container.scrollTo({ left: el.offsetLeft, behavior: "smooth" })
      }
      setActiveIndex(index)
      // Reset zoom on all images when navigating away
      zoomRefs.current.forEach((ref) => ref?.resetTransform())
    },
    []
  )

  return (
    <div className="flex flex-col lg:flex-row items-start relative w-full lg:absolute lg:inset-0 lg:overflow-hidden gap-x-4">

      {/* ── Desktop Thumbnail Sidebar ── */}
      <div className="hidden lg:flex flex-col gap-y-3 h-full overflow-y-auto no-scrollbar py-2 px-2 -ml-2">
        {images.map((image, index) => (
          <button
            key={`thumb-${image.id}`}
            onClick={(e) => {
              e.preventDefault()
              handleDesktopThumb(image, index)
            }}
            className={`relative w-16 aspect-[1/1] rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white flex-shrink-0 cursor-pointer
              ${activeIndex === index
                ? "border-black shadow-md"
                : "border-transparent hover:border-gray-400"
              }`}
          >
            {!!image.url && (
              <Image
                src={getFormattedUrl(image.url)}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover p-1"
                sizes="64px"
                unoptimized={true}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1 w-full lg:w-auto h-full min-w-0">

        {/* ── Main Gallery ── */}
        <div
          id="main-gallery-container"
          className="group flex flex-row lg:flex-col flex-1 gap-x-4 lg:gap-y-6 overflow-x-auto lg:overflow-y-auto h-full min-h-0 lg:relative snap-x lg:snap-none snap-mandatory no-scrollbar"
        >
          {images.map((image, index) => (
            <GalleryImage
              key={image.id}
              image={image}
              index={index}
              isMobile={isMobile}
              isActive={activeIndex === index}
              discountPercentage={discountPercentage}
              zoomRef={(ref) => { zoomRefs.current[index] = ref }}
            />
          ))}
          {/* Spacer to allow the last images to scroll all the way to the top in desktop */}
          {!isMobile && <div className="hidden lg:block h-full min-h-full flex-shrink-0 pointer-events-none" style={{ height: "100%" }} />}
        </div>

        {/* ── Mobile Thumbnails with active highlight ── */}
        {images.length > 1 && (
          <div className="flex lg:hidden overflow-x-auto gap-x-3 no-scrollbar py-4 px-2 -ml-1">
            {images.map((image, index) => (
              <button
                key={`mob-thumb-${image.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleMobileThumb(image, index)
                }}
                className={`relative w-16 aspect-[1/1] rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white flex-shrink-0 cursor-pointer
                  ${activeIndex === index
                    ? "border-black shadow-sm"
                    : "border-gray-200 hover:border-gray-400"
                  }`}
              >
                {!!image.url && (
                  <Image
                    src={getFormattedUrl(image.url)}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover p-1"
                    sizes="64px"
                    unoptimized={true}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
