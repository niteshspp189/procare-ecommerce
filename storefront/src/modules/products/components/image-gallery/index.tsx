import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  return (
    <div className="flex items-start relative gap-x-4">
      {/* Thumbnail Sidebar */}
      <div className="hidden lg:flex flex-col gap-y-3 sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar py-2">
        {images.map((image, index) => (
          <a
            key={`thumb-${image.id}`}
            href={`#${image.id}`}
            className="relative w-16 aspect-[1/1] rounded-lg overflow-hidden border border-transparent hover:border-black transition-all bg-gray-50 flex-shrink-0"
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
          </a>
        ))}
      </div>

      {/* Main Gallery */}
      <div className="flex flex-col flex-1 gap-y-6">
        {images.map((image, index) => {
          return (
            <div
              key={image.id}
              className="relative aspect-square w-full overflow-hidden bg-white solid-box p-4 md:p-8 animate-fade-in-up"
              id={image.id}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index === 0}
                  className="absolute inset-4 md:inset-8 object-contain"
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
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
