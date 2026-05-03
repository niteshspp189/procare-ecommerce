"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductItemCard from "@modules/common/components/product-item-card"
import StagingProductCard from "./staging-product-card"
import CarouselWrapper from "@modules/products/components/related-products/carousel-wrapper"

export default function BestSellersTabs({
    categories,
    region,
    initialProducts,
    isStaging,
}: {
    categories: HttpTypes.StoreProductCategory[]
    region: HttpTypes.StoreRegion
    initialProducts: Record<string, HttpTypes.StoreProduct[]>
    isStaging?: boolean
}) {
    const [activeTab, setActiveTab] = useState(categories[0]?.id || "")

    const activeCategory = categories.find(c => c.id === activeTab)
    const products = initialProducts[activeTab] || []

    return (
        <div className="py-12">
            <div className="flex justify-start md:justify-center gap-6 md:gap-8 mb-12 overflow-x-auto pb-4 px-4 no-scrollbar">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className={`text-sm font-bold uppercase tracking-widest whitespace-nowrap pb-2 transition-all shrink-0 ${activeTab === category.id
                            ? "text-black border-b-2 border-black"
                            : "text-gray-400 hover:text-black border-b-2 border-transparent"
                            }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in-up">
                {products.length > 0 ? (
                    isStaging ? (
                        <CarouselWrapper>
                            {products.map((product) => (
                                <div key={product.id} className="min-w-[320px] w-[320px] snap-start shrink-0">
                                    <StagingProductCard product={product} region={region} />
                                </div>
                            ))}
                        </CarouselWrapper>
                    ) : (
                        <ul className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            {products.map((product) => (
                                <li key={product.id} className="animate-fade-in">
                                    <ProductItemCard product={product} region={region} />
                                </li>
                            ))}
                        </ul>
                    )
                ) : (
                    <div className="text-center py-20 text-gray-500 uppercase tracking-widest text-sm">
                        No products found in this category
                    </div>
                )}

                {activeCategory && (
                    <div className="text-center mt-12">
                        <a
                            href={`/categories/${activeCategory.handle}`}
                            className="inline-block bg-[#00b5a4] text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-[#009d8e] transition-all"
                        >
                            View All {activeCategory.name}
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
