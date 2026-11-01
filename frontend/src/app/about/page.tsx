import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { brandName, defaultOgImage, localizedAlternates, localizedUrl, ogLocale } from "@/lib/seo"

import { ContentPage, ContentSection } from "@/components/layout/ContentPage"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.about")
  const locale = await getLocale()
  return {
    title: t("title"),
    description: t("intro"),
    alternates: localizedAlternates("/about", locale),
    openGraph: {
      type: "website",
      url: localizedUrl("/about", locale),
      title: `${t("title")} | ${brandName(locale)}`,
      description: t("intro"),
      siteName: brandName(locale),
      locale: ogLocale(locale),
      images: [defaultOgImage(locale)],
    },
  }
}

export default async function Page() {
  const t = await getTranslations("pages.about")
  return (
    <ContentPage
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      sections={t.raw("sections") as ContentSection[]}
      footnote={t.has("footnote") ? t("footnote") : undefined}
    />
  )
}
