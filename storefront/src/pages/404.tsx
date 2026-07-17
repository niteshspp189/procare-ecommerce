// This pages/404.tsx provides a minimal Pages Router 404 page.
// It overrides Next.js 15's built-in _error.js for /404 static generation,
// preventing the <Html> context validation error.
export default function Custom404() {
  if (typeof window !== "undefined") {
    window.location.replace("/")
  }
  return null
}
