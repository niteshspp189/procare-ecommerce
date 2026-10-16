import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"

import { getSeoForPath } from "@lib/util/seo"

const accountSeo = getSeoForPath("/account")

export const metadata: Metadata = {
  title: accountSeo?.title || "My Account | Pro Premium Care",
  description:
    accountSeo?.description ||
    "Access your Pro Premium Care account to manage your shopping profile and conveniently access your account information.",
  keywords: accountSeo?.keywords
    ? accountSeo.keywords.split(",").map((k) => k.trim())
    : undefined,
}

export default function Login() {
  return <LoginTemplate />
}
