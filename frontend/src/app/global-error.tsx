"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

/**
 * Last-resort screen when the root layout itself fails. It renders its own <html>, without the
 * translation provider, so the text is shown in both languages.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f4ed",
          color: "#141413",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.5rem" }}>حدث خطأ غير متوقع</h1>
          <p style={{ margin: "0 0 0.25rem", color: "#5e5d59" }} dir="ltr">
            Something went wrong. Please try again.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#87867f" }} dir="ltr">
              {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.25rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#c96442",
              color: "#faf9f5",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة · Try again
          </button>
        </div>
      </body>
    </html>
  )
}
