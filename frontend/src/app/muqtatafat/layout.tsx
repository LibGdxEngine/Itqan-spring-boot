import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { localizedAlternates } from "@/lib/seo"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "seo.muqtatafat" })
  const keywords = t("keywords")
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean)
  const url = `${SITE_URL}/muqtatafat`
  const isAr = locale === "ar"

  return {
    title: t("title"),
    description: t("description"),
    keywords,
    alternates: localizedAlternates("/muqtatafat", locale),
    openGraph: {
      type: "website",
      url,
      title: t("title"),
      description: t("description"),
      siteName: isAr ? "إتقان" : "Itqan",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? "en_US" : "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  }
}

export default function MuqtatafatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
