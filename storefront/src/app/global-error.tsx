"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
            fontFamily: "Inter, -apple-system, sans-serif",
            color: "#111",
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: "clamp(64px, 10vw, 120px)",
              fontWeight: "900",
              color: "#00b5a4",
              lineHeight: 1,
              marginBottom: "16px",
              letterSpacing: "-4px",
            }}
          >
            500
          </div>
          <h1
            style={{
              fontSize: "clamp(20px, 3vw, 32px)",
              fontWeight: "700",
              marginBottom: "12px",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              maxWidth: "400px",
              marginBottom: "32px",
              lineHeight: "1.6",
            }}
          >
            We&apos;re sorry, an unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "#00b5a4",
              color: "#fff",
              fontWeight: "700",
              fontSize: "14px",
              padding: "12px 28px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
