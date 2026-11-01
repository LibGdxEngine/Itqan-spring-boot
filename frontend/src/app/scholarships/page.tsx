import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { GraduationCap, HandHeart, ClipboardList, SearchCheck, BookOpenCheck } from "lucide-react"

import { PublicPage } from "@/components/layout/PublicPage"
import { scholarshipMetadata } from "./metadata"

export const generateMetadata = () => scholarshipMetadata("landing", "/scholarships")

const STEPS = [
  { key: "apply", Icon: ClipboardList },
  { key: "review", Icon: SearchCheck },
  { key: "study", Icon: BookOpenCheck },
] as const

const FAQ_KEYS = ["who", "cost", "donorPrivacy", "howUsed", "decision"] as const

export default async function ScholarshipsPage() {
  const t = await getTranslations("scholarships")

  return (
    <PublicPage>
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6">
        <header className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold tracking-[0.15em] text-brand">{t("landing.eyebrow")}</p>
          <h1 className="text-4xl text-ink sm:text-5xl" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
            {t("landing.title")}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-2">{t("landing.intro")}</p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <GraduationCap className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="text-2xl font-semibold text-ink">{t("landing.applyTitle")}</h2>
            <p className="mt-2 flex-1 leading-relaxed text-ink-2">{t("landing.applyBody")}</p>
            <Link
              href="/scholarships/apply"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-brand px-5 font-medium text-on-night transition-colors hover:bg-brand-hover"
            >
              {t("landing.applyCta")}
            </Link>
          </section>

          <section className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <HandHeart className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="text-2xl font-semibold text-ink">{t("landing.donateTitle")}</h2>
            <p className="mt-2 flex-1 leading-relaxed text-ink-2">{t("landing.donateBody")}</p>
            <Link
              href="/scholarships/donate"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-brand px-5 font-medium text-brand transition-colors hover:bg-subtle"
            >
              {t("landing.donateCta")}
            </Link>
          </section>
        </div>

        <section className="mt-16">
          <h2 className="mb-6 text-center text-2xl font-semibold text-ink">{t("landing.stepsTitle")}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map(({ key, Icon }, index) => (
              <li key={key} className="rounded-xl border border-line bg-surface p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-night">
                    {index + 1}
                  </span>
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </div>
                <h3 className="font-semibold text-ink">{t(`landing.steps.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-2">{t(`landing.steps.${key}.body`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-16 max-w-3xl">
          <h2 className="mb-6 text-2xl font-semibold text-ink">{t("landing.faqTitle")}</h2>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {FAQ_KEYS.map((key) => (
              <details key={key} className="group p-5">
                <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
                  {t(`landing.faq.${key}.q`)}
                </summary>
                <p className="mt-2 leading-relaxed text-ink-2">{t(`landing.faq.${key}.a`)}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </PublicPage>
  )
}
