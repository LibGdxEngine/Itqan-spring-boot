import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { brandName, defaultOgImage, localizedAlternates, ogAlternateLocale, ogLocale } from "@/lib/seo"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "seo.muqtatafat" })
  const keywords = t("keywords")
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean)
  const url = `${SITE_URL}/muqtatafat`

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
      siteName: brandName(locale),
      locale: ogLocale(locale),
      alternateLocale: ogAlternateLocale(locale),
      images: [defaultOgImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [defaultOgImage(locale).url],
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
