"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useState, useRef, MouseEvent } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  discountPercentage?: number
}

type ZoomableImageProps = {
  src: string
  alt: string
  priority?: boolean
  unoptimized?: boolean
}

const ZoomableImage = ({ src, alt, priority, unoptimized }: ZoomableImageProps) => {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={1}
      maxScale={4}
      wheel={{ step: 0.1 }}
    >
      <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full relative">
        <Image
          src={src}
          priority={priority}
          className="absolute inset-4 md:inset-8 object-contain"
          alt={alt}
          fill
          sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
          unoptimized={unoptimized}
        />
      </TransformComponent>
    </TransformWrapper>
  )
}

const ImageGallery = ({ images, discountPercentage }: ImageGalleryProps) => {
  return (
    <div className="flex flex-col lg:flex-row items-start relative w-full lg:absolute lg:inset-0 lg:overflow-hidden gap-x-4">
      {/* Desktop Thumbnail Sidebar */}
      <div className="hidden lg:flex flex-col gap-y-3 h-full overflow-y-auto no-scrollbar py-2">
        {images.map((image, index) => (
          <button
            key={`thumb-${image.id}`}
            onClick={(e) => {
              e.preventDefault()
              const startTime = performance.now()
              console.log(`[Gallery] Thumbnail clicked: ${image.id}`)
              const container = document.getElementById('main-gallery-container')
              const el = document.getElementById(`gallery-img-${image.id}`)
              if (container && el) {
                window.scrollTo({ top: 0, behavior: 'smooth' })
                console.log(`[Gallery] Current scrollTop: ${container.scrollTop}, Target offsetTop: ${el.offsetTop}`)
                container.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
                setTimeout(() => {
                  console.log(`[Gallery] Scroll execution time: ${(performance.now() - startTime).toFixed(2)}ms. Final scrollTop: ${container.scrollTop}`)
                }, 100)
              } else {
                console.log(`[Gallery] Element missing! container: ${!!container}, el: ${!!el}`)
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
                unoptimized={true}
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1 w-full lg:w-auto h-full min-w-0">
        {/* Main Gallery */}
        <div 
          id="main-gallery-container"
          className="flex flex-row lg:flex-col flex-1 gap-x-4 lg:gap-y-6 overflow-x-auto lg:overflow-y-auto h-full min-h-0 lg:relative snap-x lg:snap-none snap-mandatory no-scrollbar lg:pb-0"
        >
          {images.map((image, index) => {
            return (
              <div
                key={image.id}
                className="relative aspect-square w-full flex-shrink-0 snap-center lg:snap-align-none overflow-hidden bg-white solid-box p-4 md:p-8 animate-fade-in-up"
                id={`gallery-img-${image.id}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {index === 0 && discountPercentage && discountPercentage > 0 ? (
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 bg-emerald-600 text-white text-xs md:text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md z-20">
                    {discountPercentage}% OFF
                  </div>
                ) : null}
                {!!image.url && (
                  <ZoomableImage
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    priority={index === 0}
                    unoptimized={true}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile Thumbnails */}
        {images.length > 1 && (
          <div className="flex lg:hidden overflow-x-auto gap-x-3 no-scrollbar py-4 px-1">
            {images.map((image, index) => (
              <button
                key={`mob-thumb-${image.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  const container = document.getElementById('main-gallery-container')
                  const el = document.getElementById(`gallery-img-${image.id}`)
                  if (container && el) {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    container.scrollTo({ left: el.offsetLeft, behavior: 'smooth' })
                  }
                }}
                className="relative w-16 aspect-[1/1] rounded-lg overflow-hidden border border-gray-200 hover:border-black transition-all bg-gray-50 flex-shrink-0 cursor-pointer"
              >
                {!!image.url && (
                  <Image
                    src={image.url}
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
