"use client"

import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { useState } from "react"
import { Spinner } from "@medusajs/icons"
import Button from "@modules/common/components/button"

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
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadMore = () => {
    setIsLoading(true)
    // Small delay to simulate loading for a smoother experience
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + PRODUCT_LIMIT, products.length))
      setIsLoading(false)
    }, 400)
  }

  const displayedProducts = products.slice(0, displayedCount)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-3 gap-x-3 gap-y-6 small:gap-x-6 small:gap-y-8"
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
        <div className="flex justify-center items-center py-12">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="secondary"
            className="min-w-[180px] flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="animate-spin">
                <Spinner />
              </span>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </>
  )
}
