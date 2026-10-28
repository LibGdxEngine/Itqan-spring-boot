import * as Sentry from "@sentry/nextjs"

// Server-side error reporting. Nothing is sent unless NEXT_PUBLIC_SENTRY_DSN is set.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
  })
}

// Reports errors thrown while rendering server components, route handlers and the proxy.
export const onRequestError = Sentry.captureRequestError
