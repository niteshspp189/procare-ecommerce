"use client"

import Back from "@modules/common/icons/back"
import FastDelivery from "@modules/common/icons/fast-delivery"
import Refresh from "@modules/common/icons/refresh"

import Accordion from "./accordion"
import { HttpTypes } from "@medusajs/types"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  const metadata = product.metadata || {}

  const tabs = [
    {
      label: "Product Description",
      component: <ProductDescriptionTab product={product} />,
      condition: !!product.description
    },
    {
      label: "How to Use",
      component: <MetadataTab title="Usage Instructions" content={metadata.how_to_use as string} />,
      condition: !!metadata.how_to_use
    },
    {
      label: "Ingredients",
      component: <MetadataTab title="Key Ingredients" content={metadata.ingredients as string} />,
      condition: !!metadata.ingredients
    },
    {
      label: "Suitable For",
      component: <MetadataTab title="Recommended For" content={metadata.suitable_for as string} />,
      condition: !!metadata.suitable_for
    },
    {
      label: "Shipping & Returns",
      component: <ShippingInfoTab />,
      condition: true
    },
  ]

  return (
    <div className="w-full">
      <Accordion type="multiple">
        {tabs.filter(t => t.condition).map((tab, i) => (
          <Accordion.Item
            key={i}
            title={tab.label}
            headingSize="medium"
            value={tab.label}
          >
            {tab.component}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  )
}

const MetadataTab = ({ title, content }: { title: string; content?: any }) => {
  if (!content) return null

  // Ensure we are working with a string
  const contentString = typeof content === 'string'
    ? content
    : JSON.stringify(content);

  const lines = contentString.split('\n').filter(l => l.trim().length > 0)

  return (
    <div className="text-small-regular py-8">
      <div className="flex flex-col gap-y-4">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-x-2">
            <span className="text-ui-fg-subtle">•</span>
            <p>{line.replace(/^[*-]\s*|^\d+\.\s*/, "").replace(/^[#]{1,4}\s*/, "")}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const ProductDescriptionTab = ({ product }: ProductTabsProps) => {
  const metadata = product.metadata || {}
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div>
          <p className="mb-4">{product.description}</p>
          {metadata.key_benefits && (
            <div className="mt-4">
              <span className="font-semibold block mb-2">Key Benefits</span>
              <MetadataTab title="Benefits" content={metadata.key_benefits as string} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-8 border-t border-gray-100 pt-8">
          <div className="flex flex-col gap-y-4">
            <div>
              <span className="font-semibold">Type</span>
              <p>{product.type ? product.type.value : "-"}</p>
            </div>
            <div>
              <span className="font-semibold">Country of origin</span>
              <p>{product.origin_country || "India"}</p>
            </div>
          </div>
          <div className="flex flex-col gap-y-4">
            <div>
              <span className="font-semibold">Formula</span>
              <p>{(metadata.formula as string) || "Standard"}</p>
            </div>
            <div>
              <span className="font-semibold">Contains</span>
              <p>{(metadata.includes as string) || "1 Unit"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ShippingInfoTab = () => {
  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 gap-y-8">
        <div className="flex items-start gap-x-2">
          <FastDelivery />
          <div>
            <span className="font-semibold">Fast delivery</span>
            <p className="max-w-sm">
              Your package will arrive in 3-5 business days at your pick up
              location or in the comfort of your home.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Refresh />
          <div>
            <span className="font-semibold">Simple exchanges</span>
            <p className="max-w-sm">
              Is the fit not quite right? No worries - we&apos;ll exchange your
              product for a new one.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-x-2">
          <Back />
          <div>
            <span className="font-semibold">Easy returns</span>
            <p className="max-w-sm">
              Just return your product and we&apos;ll refund your money. No
              questions asked – we&apos;ll do our best to make sure your return
              is hassle-free.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
