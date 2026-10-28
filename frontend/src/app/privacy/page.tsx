import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { localizedAlternates } from "@/lib/seo"

import { ContentPage, ContentSection } from "@/components/layout/ContentPage"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.privacy")
  const locale = await getLocale()
  return { title: t("title"), description: t("intro"), alternates: localizedAlternates("/privacy", locale) }
}

export default async function Page() {
  const t = await getTranslations("pages.privacy")
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
