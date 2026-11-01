"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, HeartHandshake, Loader2 } from "lucide-react"

import { PublicPage } from "@/components/layout/PublicPage"
import { formatMoney } from "@/components/admin/ui"
import { donationsApi, type DonationStatusResponse } from "@/lib/scholarships-api"

type View = "loading" | "pending" | "done" | "failed"

function ThankYou() {
  const t = useTranslations("scholarships.thankYou")
  const locale = useLocale()
  const reference = useSearchParams().get("session_id")
  const [view, setView] = useState<View>("loading")
  const [donation, setDonation] = useState<DonationStatusResponse | null>(null)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      if (!reference) {
        setView("failed")
        return
      }
      // The Paymob callback can arrive a few seconds after the redirect, so poll briefly.
      for (let attempt = 0; attempt < 8 && mounted; attempt++) {
        try {
          const status = await donationsApi.status(reference)
          if (!mounted) return
          setDonation(status)
          if (status.status === "COMPLETED") {
            setView("done")
            return
          }
          if (status.status === "FAILED" || status.status === "REFUNDED") {
            setView("failed")
            return
          }
          setView("pending")
        } catch {
          // Try again below.
        }
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
      if (mounted) setView((v) => (v === "done" ? v : "pending"))
    }
    void check()
    return () => {
      mounted = false
    }
  }, [reference])

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-20 pt-32 text-center">
      {view === "loading" || view === "pending" ? <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand" /> : null}
      {view === "done" ? <HeartHandshake className="mb-4 h-12 w-12 text-brand" /> : null}
      {view === "failed" ? <AlertCircle className="mb-4 h-12 w-12 text-danger" /> : null}

      <h1 className="text-2xl font-semibold text-ink">
        {view === "done" ? t("title") : view === "failed" ? t("failedTitle") : t("checking")}
      </h1>
      <p className="mt-3 leading-relaxed text-ink-2">
        {view === "done" && donation
          ? t("body", { amount: formatMoney(donation.amount, donation.currency, locale) })
          : view === "failed"
            ? t("failedBody")
            : view === "pending"
              ? t("pendingBody")
              : null}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {view === "failed" ? (
          <Link href="/scholarships/donate" className="inline-flex h-10 items-center rounded-lg bg-brand px-5 font-medium text-on-night hover:bg-brand-hover">
            {t("tryAgain")}
          </Link>
        ) : null}
        <Link href="/" className="inline-flex h-10 items-center rounded-lg border border-line-strong px-5 font-medium text-ink hover:bg-subtle">
          {t("home")}
        </Link>
      </div>
    </div>
  )
}

export default function DonationThankYouPage() {
  return (
    <PublicPage>
      <Suspense>
        <ThankYou />
      </Suspense>
    </PublicPage>
  )
}
