import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

const OrderRedirectWidget = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // When landing on the default /orders route, seamlessly redirect to our enhanced /all-orders view
    if (location.pathname === "/orders" || location.pathname === "/orders/") {
      navigate("/all-orders", { replace: true })
    }
  }, [location.pathname, navigate])

  return null
}

export default OrderRedirectWidget
