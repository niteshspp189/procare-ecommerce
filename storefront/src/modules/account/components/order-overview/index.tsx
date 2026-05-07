"use client"

import { Button, Text, clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { formatDate, formatOrderDisplayId } from "@lib/util/format-date"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="w-full">
        <div className="flex flex-col gap-y-4">
          <div className="hidden sm:grid grid-cols-6 gap-4 py-4 border-b border-gray-200 text-ui-fg-subtle text-small-regular font-bold uppercase tracking-wider">
            <div>Order ID</div>
            <div>Date</div>
            <div>Status</div>
            <div>Amount</div>
            <div>Items</div>
            <div className="text-right">Action</div>
          </div>
          {orders.map((order) => {
            const numberOfLines = order.items?.reduce((acc, item) => acc + item.quantity, 0) ?? 0

            return (
              <div key={order.id} className="grid grid-cols-1 sm:grid-cols-6 gap-4 py-6 border-b border-gray-100 items-center hover:bg-gray-50 transition-colors px-2 rounded-lg">
                <div className="flex flex-col">
                  <span className="sm:hidden text-ui-fg-subtle text-[10px] uppercase font-bold">Order ID</span>
                  <span className="font-black text-lg">{formatOrderDisplayId(order.display_id ?? "")}</span>
                </div>
                <div className="flex flex-col">
                  <span className="sm:hidden text-ui-fg-subtle text-[10px] uppercase font-bold">Date</span>
                  <Text className="text-ui-fg-subtle">
                    {formatDate(order.created_at)}
                  </Text>
                </div>
                <div className="flex flex-col">
                  <span className="sm:hidden text-ui-fg-subtle text-[10px] uppercase font-bold">Status</span>
                  <div className="flex items-center gap-x-2">
                    <div className={clx("h-2 w-2 rounded-full", {
                      "bg-green-500": order.fulfillment_status === "fulfilled",
                      "bg-orange-500": order.fulfillment_status === "not_fulfilled",
                      "bg-red-500": order.fulfillment_status === "canceled",
                    })} />
                    <Text className="text-ui-fg-subtle capitalize">
                      {order.fulfillment_status.replace("_", " ")}
                    </Text>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="sm:hidden text-ui-fg-subtle text-[10px] uppercase font-bold">Amount</span>
                  <Text className="font-bold text-[#00b5a4]">
                    {convertToLocale({
                      amount: order.total,
                      currency_code: order.currency_code,
                    })}
                  </Text>
                </div>
                <div className="flex flex-col">
                  <span className="sm:hidden text-ui-fg-subtle text-[10px] uppercase font-bold">Items</span>
                  <Text className="text-ui-fg-subtle">
                    {numberOfLines} {numberOfLines > 1 ? "items" : "item"}
                  </Text>
                </div>
                <div className="flex justify-start sm:justify-end gap-x-2">
                  <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
                    <Button variant="secondary" className="!bg-[#00b5a4] !text-white !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full px-6 text-xs">
                      Details
                    </Button>
                  </LocalizedClientLink>
                  <a 
                    href={`/api/invoice/${order.id}`}
                    className="flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-all text-xs"
                  >
                    Invoice
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center gap-y-4"
      data-testid="no-orders-container"
    >
      <h2 className="text-large-semi">Nothing to see here</h2>
      <p className="text-base-regular">
        You don&apos;t have any orders yet, let us change that {":)"}
      </p>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button className="!bg-[#00b5a4] !border-[#00b5a4] hover:!bg-[#009d8e] !rounded-full px-8">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
