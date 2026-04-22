"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type CartDrawerContextType = {
  isOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const CartDrawerContext = createContext<CartDrawerContextType>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
})

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])

  return (
    <CartDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
      {children}
    </CartDrawerContext.Provider>
  )
}

export function useCartDrawer() {
  return useContext(CartDrawerContext)
}
