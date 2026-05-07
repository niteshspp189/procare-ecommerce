import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

import PageProgress from "@modules/layout/components/page-progress"
import { Suspense } from "react"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <Suspense fallback={null}>
          <PageProgress />
        </Suspense>
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
