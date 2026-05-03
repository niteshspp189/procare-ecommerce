import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

const StorefrontLinkWidget = ({ data }: any) => {
  const openStorefront = () => {
    const storefrontUrl = `${window.location.origin.replace(':9000', ':8000')}/products/${data.handle}`
    window.open(storefrontUrl, '_blank')
  }

  return (
    <div className="flex justify-end mb-4">
      <Button 
        variant="secondary" 
        size="small" 
        onClick={openStorefront}
        className="flex items-center gap-x-2"
      >
        <ArrowUpRightOnBox />
        View on Storefront
      </Button>
    </div>
  )
}

export default StorefrontLinkWidget
