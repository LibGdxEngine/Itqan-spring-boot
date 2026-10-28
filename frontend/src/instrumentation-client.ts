import * as Sentry from "@sentry/nextjs"

// Browser error reporting. NEXT_PUBLIC_SENTRY_DSN is inlined at build time; empty = disabled.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
  })
}
