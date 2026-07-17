// This pages/500.tsx provides a minimal Pages Router 500 page.
// It overrides Next.js 15's built-in _error.js for /500 static generation,
// preventing the <Html> context validation error.
export default function Custom500() {
  if (typeof window !== "undefined") {
    window.location.replace("/")
  }
  return null
}
