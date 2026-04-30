import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummary = ({ cart }: { cart: any }) => {
  return (
    <div className="sticky top-0 flex flex-col gap-y-6 py-8 small:py-0">
      <div className="w-full bg-gray-50 rounded-2xl p-6 flex flex-col gap-y-4">
        <h2 className="text-base font-semibold text-black">Order Summary</h2>
        <ItemsPreviewTemplate cart={cart} />
        <Divider />
        <DiscountCode cart={cart} />
        <Divider />
        <CartTotals totals={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
