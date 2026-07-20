import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading } from "@medusajs/ui"
import { ArrowUpRightOnBox } from "@medusajs/icons"

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

const StorefrontLinkWidget = ({ data }: any) => {
  const openStorefront = () => {
    const origin = window.location.origin
    const storefrontUrl = `${origin}/products/${data.handle}`
    window.open(storefrontUrl, '_blank')
  }

  return (
    <Container className="p-4 mb-4 flex flex-col gap-y-3">
      <Heading level="h2" className="text-sm font-semibold">🔗 Storefront Link</Heading>
      <Button 
        variant="secondary" 
        size="small" 
        onClick={openStorefront}
        className="flex items-center justify-center gap-x-2 w-full"
      >
        <ArrowUpRightOnBox />
        View Product on Storefront
      </Button>
    </Container>
  )
}

export default StorefrontLinkWidget
