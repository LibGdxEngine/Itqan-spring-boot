"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Award, BadgeCheck, Copy, Loader2, Printer, ShieldX } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Certificate, certificatesApi } from "@/lib/learning-api"

/** Public, printable certificate. Anyone with the code can verify it. */
export default function CertificatePage() {
  const t = useTranslations("certificate")
  const locale = useLocale()
  const { toast } = useToast()
  const params = useParams<{ code: string }>()
  const code = decodeURIComponent(params.code)
  const [certificate, setCertificate] = React.useState<Certificate | null | undefined>(undefined)

  React.useEffect(() => {
    certificatesApi
      .verify(code)
      .then(setCertificate)
      .catch(() => setCertificate(null))
  }, [code])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: t("linkCopied") })
    } catch {
      // Clipboard blocked; the address bar still has the link.
    }
  }

  return (
    <div className="min-h-screen bg-canvas print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main id="main-content" className="mx-auto max-w-4xl px-4 pb-16 pt-24 print:p-0">
        {certificate === undefined ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : certificate === null ? (
          <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-16 text-center">
            <ShieldX className="mb-3 h-10 w-10 text-danger" />
            <h1 className="text-xl font-semibold text-ink">{t("notFound")}</h1>
            <p className="mt-1 text-sm text-ink-3">{t("notFoundHint", { code })}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
                <BadgeCheck className="h-4 w-4" /> {t("verified")}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void copyLink()}>
                  <Copy /> {t("copyLink")}
                </Button>
                <Button onClick={() => window.print()}>
                  <Printer /> {t("print")}
                </Button>
              </div>
            </div>

            <article className="relative overflow-hidden rounded-2xl border-[10px] border-double border-brand/70 bg-surface px-6 py-12 text-center shadow-xl sm:px-14 print:shadow-none">
              <div aria-hidden className="pointer-events-none absolute inset-0 pattern-islamic opacity-[0.07]" />
              <div className="relative">
                <Award className="mx-auto mb-4 h-14 w-14 text-brand" />
                <p className="text-sm uppercase tracking-[0.3em] text-ink-3">{t("heading")}</p>
                <p className="mt-6 text-ink-2">{t("certifies")}</p>
                <h1 className="my-3 text-3xl text-ink sm:text-5xl" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
                  {certificate.studentName}
                </h1>
                <p className="text-ink-2">{t("completed")}</p>
                <h2 className="mx-auto mt-3 max-w-2xl text-2xl font-semibold text-ink">
                  <Link href={`/courses/${certificate.courseId}`} className="hover:text-brand">
                    {certificate.courseTitle}
                  </Link>
                </h2>
                {certificate.instructorName ? (
                  <p className="mt-2 text-sm text-ink-3">{t("instructor", { name: certificate.instructorName })}</p>
                ) : null}
                <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-line-strong pt-6 text-sm">
                  <div>
                    <p className="text-ink-3">{t("issued")}</p>
                    <p className="font-medium text-ink">
                      {new Date(certificate.issuedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-3">{t("code")}</p>
                    <p className="font-mono font-medium text-ink" dir="ltr">{certificate.code}</p>
                  </div>
                </div>
                <p className="mt-6 text-xs text-ink-3" dir="ltr">
                  {t("verifyAt")} {typeof window !== "undefined" ? window.location.origin : ""}/certificates/{certificate.code}
                </p>
              </div>
            </article>
          </>
        )}
      </main>
    </div>
  )
}
