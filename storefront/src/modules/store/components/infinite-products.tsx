"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useEffect, useRef, useState } from "react"
import { Spinner } from "@medusajs/icons"

type InfiniteProductsProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

const PRODUCT_LIMIT = 12

export default function InfiniteProducts({
  products,
  region,
}: InfiniteProductsProps) {
  const [displayedCount, setDisplayedCount] = useState(PRODUCT_LIMIT)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(loadMoreRef, "200px")

  useEffect(() => {
    if (isVisible && displayedCount < products.length) {
      // Small delay to simulate loading and give a smoother experience
      const timer = setTimeout(() => {
        setDisplayedCount((prev) => Math.min(prev + PRODUCT_LIMIT, products.length))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, displayedCount, products.length])

  const displayedProducts = products.slice(0, displayedCount)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-3 gap-y-6 small:gap-x-6 small:gap-y-8"
        data-testid="products-list"
      >
        {displayedProducts.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      
      {displayedCount < products.length && (
        <div 
          ref={loadMoreRef} 
          className="flex justify-center items-center py-12 text-gray-400"
        >
          <div className="animate-spin">
            <Spinner />
          </div>
        </div>
      )}
    </>
  )
}
