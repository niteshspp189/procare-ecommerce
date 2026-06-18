"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useRef, MouseEvent } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

type ZoomableImageProps = {
  src: string
  alt: string
  priority?: boolean
  unoptimized?: boolean
}

const ZoomableImage = ({ src, alt, priority, unoptimized }: ZoomableImageProps) => {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    
    // Calculate cursor percentage coordinates relative to the image container
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100))
    
    setZoomPos({ x, y })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-full cursor-zoom-in overflow-hidden select-none"
    >
      <div
        className="w-full h-full"
        style={{
          transform: isHovered ? "scale(2.2)" : "scale(1)",
          transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          transition: isHovered 
            ? "transform 0.08s cubic-bezier(0.25, 0.46, 0.45, 0.94)" 
            : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform-origin 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <Image
          src={src}
          priority={priority}
          className="absolute inset-4 md:inset-8 object-contain pointer-events-none"
          alt={alt}
          fill
          sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          unoptimized={unoptimized}
        />
      </div>
      
      {/* Zoom indicator overlay */}
      <div 
        className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg pointer-events-none transition-opacity duration-300 shadow-sm border border-white/10 flex items-center gap-1.5"
        style={{ opacity: isHovered ? 0.9 : 0 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
        <span className="text-[10px] font-bold tracking-widest uppercase">Zoom</span>
      </div>
    </div>
  )
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative gap-x-4">
      {/* Thumbnail Sidebar */}
      <div className="hidden lg:flex flex-col gap-y-3 sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar py-2">
        {images.map((image, index) => (
          <button
            key={`thumb-${image.id}`}
            onClick={(e) => {
              e.preventDefault()
              const el = document.getElementById(image.id)
              if (el) {
                el.scrollIntoView({ behavior: "smooth" })
              }
            }}
            className="relative w-16 aspect-[1/1] rounded-lg overflow-hidden border border-transparent hover:border-black transition-all bg-gray-50 flex-shrink-0 cursor-pointer"
          >
            {!!image.url && (
              <Image
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover p-1"
                sizes="64px"
                unoptimized={image.url?.includes("/static") || image.url?.includes("localhost:9000")}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Gallery */}
      <div className="flex flex-col flex-1 gap-y-6">
        {images.map((image, index) => {
          return (
            <div
              key={image.id}
              className="relative aspect-square w-full overflow-hidden bg-white solid-box p-4 md:p-8 animate-fade-in-up scroll-mt-24"
              id={image.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {!!image.url && (
                <ZoomableImage
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  priority={index === 0}
                  unoptimized={image.url?.includes("/static") || image.url?.includes("localhost:9000")}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
