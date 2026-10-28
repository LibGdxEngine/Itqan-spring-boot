"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Shown when a page throws while rendering. The navbar is left out on purpose: it may be what failed. */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors.generic")

  useEffect(() => {
    console.error(error)
    Sentry.captureException(error)
  }, [error])

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="text-3xl text-ink">{t("title")}</h1>
      <p className="mt-3 max-w-md text-ink-2">{t("description")}</p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-ink-3" dir="ltr">
          {t("reference")}: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw /> {t("retry")}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("home")}</Link>
        </Button>
      </div>
    </main>
  )
}
