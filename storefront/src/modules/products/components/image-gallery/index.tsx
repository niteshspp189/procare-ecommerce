"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null
  const trimmed = urlOrId.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  videos?: (string | { url?: string; id?: string })[]
  discountPercentage?: number
}

const getFormattedUrl = (url: string) => {
  let formattedUrl = url || "/images/polish.jpeg"
  if (!formattedUrl.startsWith("http") && !formattedUrl.startsWith("/")) {
    formattedUrl = "/" + formattedUrl
  }
  return encodeURI(formattedUrl)
}

type GalleryItem =
  | {
      type: "image"
      id: string
      url: string
      image: HttpTypes.StoreProductImage
    }
  | {
      type: "video"
      id: string
      videoId: string
      embedUrl: string
      thumbUrl: string
      url: string
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

  const panDisabled = isMobile && scale <= 1

  return (
    <div
      id={`gallery-item-${image.id}`}
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
            mode: "toggle",
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
          <div className="bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            {isMobile ? "Pinch or double-tap to reset" : "Double-click to reset"}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Per-video viewport component ──────────────────────────────────────────────
type GalleryVideoProps = {
  item: Extract<GalleryItem, { type: "video" }>
  index: number
  isActive: boolean
  onActivate: () => void
}

const GalleryVideo = ({ item, index, isActive, onActivate }: GalleryVideoProps) => {
  return (
    <div
      id={`gallery-item-${item.id}`}
      className="relative aspect-square w-full flex-shrink-0 snap-center lg:snap-align-none overflow-hidden bg-black rounded-2xl shadow-md flex items-center justify-center animate-fade-in"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {isActive ? (
        <iframe
          key={`yt-iframe-${item.videoId}`}
          src={`https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={`Product Video ${index + 1}`}
          className="w-full h-full border-0 aspect-square rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div
          onClick={onActivate}
          className="relative w-full h-full cursor-pointer group flex items-center justify-center"
        >
          <img
            src={item.thumbUrl}
            alt={`Video poster ${index + 1}`}
            className="w-full h-full object-cover opacity-85 group-hover:opacity-95 transition-opacity"
          />
          <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 fill-current ml-1" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/70 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-sm">
              Click to Play
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main gallery ──────────────────────────────────────────────────────────────
const ImageGallery = ({ images, videos, discountPercentage }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const zoomRefs = useRef<(ReactZoomPanPinchRef | null)[]>([])

  const isProgrammaticScroll = useRef(false)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Parse and normalize YouTube videos (max 3)
  const parsedVideos = useMemo(() => {
    if (!videos || !Array.isArray(videos)) return []
    const list: Array<{ id: string; videoId: string; embedUrl: string; thumbUrl: string; url: string }> = []

    videos.forEach((v, i) => {
      const raw = typeof v === "string" ? v : v?.url || v?.id || ""
      const vidId = extractYouTubeId(raw)
      if (vidId) {
        list.push({
          id: `vid-${vidId}-${i}`,
          videoId: vidId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&mute=1&playsinline=1&controls=1&rel=0&modestbranding=1&enablejsapi=1`,
          thumbUrl: `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`,
          url: raw,
        })
      }
    })

    return list.slice(0, 3)
  }, [videos])

  // Combined gallery items: Product Images FIRST, then Videos
  const allItems = useMemo<GalleryItem[]>(() => {
    const imgItems: GalleryItem[] = images.map((img, idx) => ({
      type: "image",
      id: img.id || `img-${idx}`,
      url: img.url,
      image: img,
    }))

    const vidItems: GalleryItem[] = parsedVideos.map((v) => ({
      type: "video",
      id: v.id,
      videoId: v.videoId,
      embedUrl: v.embedUrl,
      thumbUrl: v.thumbUrl,
      url: v.url,
    }))

    return [...imgItems, ...vidItems]
  }, [images, parsedVideos])

  // Detect viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ── Scroll Listener: Real-time alignment tracker ──────────────────────────
  useEffect(() => {
    const container = document.getElementById("main-gallery-container")
    if (!container || allItems.length === 0) return

    let rafId: number | null = null

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const scrollPos = isMobile ? container.scrollLeft : container.scrollTop
        let closestIdx = -1
        let minDiff = Infinity

        allItems.forEach((item, idx) => {
          const el = document.getElementById(`gallery-item-${item.id}`)
          if (!el) return
          const itemPos = isMobile ? el.offsetLeft : el.offsetTop
          const diff = Math.abs(scrollPos - itemPos)

          if (diff < minDiff) {
            minDiff = diff
            closestIdx = idx
          }
        })

        if (closestIdx !== -1 && closestIdx !== activeIndex) {
          setActiveIndex(closestIdx)
        }
      })
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [allItems, isMobile, activeIndex])

  // ── Programmatic navigation on thumbnail click: REACHES TOP OF FIRST FRAME ──
  const handleThumbClick = useCallback(
    (item: GalleryItem, index: number) => {
      setActiveIndex(index)
      isProgrammaticScroll.current = true
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 750)

      const container = document.getElementById("main-gallery-container")
      const el = document.getElementById(`gallery-item-${item.id}`)
      if (container && el) {
        if (!isMobile) {
          // 1. Ensure window is scrolled up so the primary product frame is visible
          const galleryRect = container.getBoundingClientRect()
          if (galleryRect.top < 0 || galleryRect.top > 160) {
            window.scrollTo({ top: 0, behavior: "smooth" })
          }

          // 2. Scroll element DIRECTLY to the top of the first frame (el.offsetTop)
          // No mid-half road offset! It aligns cleanly at top: 0
          container.scrollTo({
            top: el.offsetTop,
            behavior: "smooth",
          })
        } else {
          // Mobile: scroll directly to element's horizontal offset
          container.scrollTo({
            left: el.offsetLeft,
            behavior: "smooth",
          })
        }
      }

      // Reset zoom on images when navigating
      zoomRefs.current.forEach((ref) => ref?.resetTransform())
    },
    [isMobile]
  )

  return (
    <div className="flex flex-col lg:flex-row items-start relative w-full lg:absolute lg:inset-0 lg:overflow-hidden gap-x-4">
      {/* ── Desktop Thumbnail Sidebar ── */}
      <div className="hidden lg:flex flex-col gap-y-3 h-full overflow-y-auto no-scrollbar py-2 px-2 -ml-2">
        {allItems.map((item, index) => {
          const isSelected = activeIndex === index
          return (
            <button
              key={`thumb-${item.id}`}
              onClick={(e) => {
                e.preventDefault()
                handleThumbClick(item, index)
              }}
              className={`relative w-16 aspect-[1/1] rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white flex-shrink-0 cursor-pointer
                ${
                  isSelected
                    ? "border-black shadow-md ring-1 ring-black"
                    : "border-transparent hover:border-gray-400"
                }`}
            >
              {item.type === "image" && !!item.url && (
                <Image
                  src={getFormattedUrl(item.url)}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover p-1"
                  sizes="64px"
                  unoptimized={true}
                />
              )}
              {item.type === "video" && (
                <div className="relative w-full h-full">
                  <img
                    src={item.thumbUrl}
                    alt={`Video Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* YouTube play badge */}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm">
                      <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col flex-1 w-full lg:w-auto h-full min-w-0">
        {/* ── Main Gallery ── */}
        <div
          id="main-gallery-container"
          className="group flex flex-row lg:flex-col flex-1 gap-x-4 lg:gap-y-6 overflow-x-auto lg:overflow-y-auto h-full min-h-0 lg:relative snap-x lg:snap-none snap-mandatory no-scrollbar"
        >
          {allItems.map((item, index) => {
            if (item.type === "image") {
              return (
                <GalleryImage
                  key={item.id}
                  image={item.image}
                  index={index}
                  isMobile={isMobile}
                  isActive={activeIndex === index}
                  discountPercentage={discountPercentage}
                  zoomRef={(ref) => {
                    zoomRefs.current[index] = ref
                  }}
                />
              )
            } else {
              return (
                <GalleryVideo
                  key={item.id}
                  item={item}
                  index={index}
                  isActive={activeIndex === index}
                  onActivate={() => handleThumbClick(item, index)}
                />
              )
            }
          })}
          {/* Bottom spacer with 100vh height to guarantee even the last video can scroll all the way to top: 0 */}
          {!isMobile && (
            <div
              className="hidden lg:block w-full flex-shrink-0 pointer-events-none"
              style={{ minHeight: "100vh" }}
            />
          )}
        </div>

        {/* ── Mobile Thumbnails with active highlight ── */}
        {allItems.length > 1 && (
          <div className="flex lg:hidden overflow-x-auto gap-x-3 no-scrollbar py-4 px-2 -ml-1">
            {allItems.map((item, index) => {
              const isSelected = activeIndex === index
              return (
                <button
                  key={`mob-thumb-${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleThumbClick(item, index)
                  }}
                  className={`relative w-16 aspect-[1/1] rounded-lg overflow-hidden border-2 transition-all duration-200 bg-white flex-shrink-0 cursor-pointer
                    ${
                      isSelected
                        ? "border-black shadow-sm ring-1 ring-black"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                >
                  {item.type === "image" && !!item.url && (
                    <Image
                      src={getFormattedUrl(item.url)}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover p-1"
                      sizes="64px"
                      unoptimized={true}
                    />
                  )}
                  {item.type === "video" && (
                    <div className="relative w-full h-full">
                      <img
                        src={item.thumbUrl}
                        alt={`Video Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {/* YouTube play badge */}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
