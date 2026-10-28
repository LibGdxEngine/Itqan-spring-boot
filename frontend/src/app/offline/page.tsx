import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { WifiOff } from "lucide-react"

import { RetryButton } from "./RetryButton"

export const metadata: Metadata = { robots: { index: false, follow: false } }

/** Shown by the service worker when a page can't load without a connection. */
export default async function OfflinePage() {
  const t = await getTranslations("offline")
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-subtle text-ink-2">
        <WifiOff className="h-8 w-8" />
      </span>
      <h1 className="text-3xl text-ink">{t("title")}</h1>
      <p className="mt-3 max-w-md text-ink-2">{t("description")}</p>
      <RetryButton label={t("retry")} />
    </main>
  )
}
