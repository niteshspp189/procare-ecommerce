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
    {
      label: "Specifications",
      component: <SpecificationsTab specifications={metadata.product_specifications} />,
      condition: !!metadata.product_specifications && Object.keys(metadata.product_specifications).length > 0
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

  const lines = contentString.split('\n')
    .filter(line => line.trim().length > 0 && /[a-zA-Z]/.test(line));

  return (
    <div className="text-small-regular py-8">
      <div className="flex flex-col gap-y-4">
        {lines.map((line, i) => {
          const lineClean = line.replace(/^[*-•]\s*/, "").replace(/^[#]{1,4}\s*/, "").trim();
          
          let leftPart = ""
          let rightPart = lineClean
          
          // Check for colon
          const colonIndex = lineClean.indexOf(':')
          if (colonIndex !== -1 && colonIndex < 35) {
            leftPart = lineClean.substring(0, colonIndex + 1).trim()
            rightPart = lineClean.substring(colonIndex + 1).trim()
          } else {
            // Check for number + dot prefix, e.g. "1. Ensure..."
            const numDotMatch = lineClean.match(/^(\d+\.)\s*(.*)$/)
            if (numDotMatch) {
              leftPart = numDotMatch[1].trim()
              rightPart = numDotMatch[2].trim()
            }
          }

          return (
            <p key={i} className="text-ui-fg-subtle leading-relaxed">
              {leftPart ? (
                <>
                  <strong className="font-semibold text-black">{leftPart}</strong>{" "}
                  {rightPart}
                </>
              ) : (
                lineClean
              )}
            </p>
          );
        })}
      </div>
    </div>
  )
}

const SpecificationsTab = ({ specifications }: { specifications: any }) => {
  if (!specifications) return null;

  let specsObj = specifications;
  if (typeof specifications === 'string') {
    try {
      specsObj = JSON.parse(specifications);
    } catch (e) {
      return <MetadataTab title="Specifications" content={specifications} />;
    }
  }

  return (
    <div className="text-small-regular py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {Object.entries(specsObj).map(([key, value], i) => (
          <div key={i} className="flex flex-col gap-y-1">
            <span className="font-semibold text-ui-fg-base">{key}</span>
            <p className="text-ui-fg-subtle">{String(value)}</p>
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
          {!!metadata.key_benefits && (
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
          <Back />
          <div>
            <span className="font-semibold">Returns Policy</span>
            <p className="max-w-sm">
              15-day return policy applicable for defective or wrong product delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTabs
