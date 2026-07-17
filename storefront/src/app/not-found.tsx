import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata = {
  title: "404 – Page Not Found | ProCare",
  description: "The page you are looking for could not be found.",
}

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif",
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
        404
      </div>
      <h1
        style={{
          fontSize: "clamp(20px, 3vw, 32px)",
          fontWeight: "700",
          marginBottom: "12px",
        }}
      >
        Page Not Found
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
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <LocalizedClientLink
        href="/"
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
          textDecoration: "none",
          transition: "background 0.2s",
          letterSpacing: "0.5px",
        }}
      >
        ← Back to Home
      </LocalizedClientLink>
    </div>
  )
}
