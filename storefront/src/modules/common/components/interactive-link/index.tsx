import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "../localized-client-link"

type InteractiveLinkProps = {
  href: string
  children?: React.ReactNode
  onClick?: () => void
}

const InteractiveLink = ({
  href,
  children,
  onClick,
  ...props
}: InteractiveLinkProps) => {
  return (
    <LocalizedClientLink
      className="flex gap-x-1 items-center group"
      href={href}
      onClick={onClick}
      {...props}
    >
      <Text className="text-black font-semibold uppercase text-xs tracking-widest">{children}</Text>
      <ArrowUpRightMini
        className="group-hover:translate-x-1 group-hover:-translate-y-1 ease-in-out duration-200 text-black"
        color="currentColor"
      />
    </LocalizedClientLink>
  )
}

export default InteractiveLink
