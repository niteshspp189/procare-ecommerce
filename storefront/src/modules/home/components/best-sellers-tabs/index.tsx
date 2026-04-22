"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

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
            <div className="flex justify-center gap-8 mb-12 overflow-x-auto pb-4">
                {categories.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                        className={`text-sm font-bold uppercase tracking-widest whitespace-nowrap pb-2 transition-all ${activeTab === category.id
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
                    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((product) => (
                            <li key={product.id} className="animate-fade-in">
                                <ProductPreview product={product} region={region} isStaging={isStaging} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-20 text-gray-500 uppercase tracking-widest text-sm">
                        No products found in this category
                    </div>
                )}

                {activeCategory && (
                    <div className="text-center mt-12">
                        <a
                            href={`/categories/${activeCategory.handle}`}
                            className="inline-block bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all"
                        >
                            View All {activeCategory.name}
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
