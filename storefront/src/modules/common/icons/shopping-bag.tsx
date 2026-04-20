import React from "react"

import { IconProps } from "types/icon"

const ShoppingBag: React.FC<IconProps> = ({
  size = "22",
  color = "currentColor",
  ...attributes
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...attributes}
    >
      <path
        d="M7 9V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.29004 22H18.71C19.7361 22 20.6128 21.2526 20.7754 20.2395L22 12.6087C22.2205 11.2349 21.1595 10 19.7681 10H4.23195C2.84049 10 1.77952 11.2349 2.00004 12.6087L3.22459 20.2395C3.38718 21.2526 4.26397 22 5.29004 22Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default ShoppingBag
