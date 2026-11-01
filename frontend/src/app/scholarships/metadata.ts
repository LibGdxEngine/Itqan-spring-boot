import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { brandName, defaultOgImage, localizedAlternates, localizedUrl, ogLocale } from "@/lib/seo"

/** Shared metadata for the scholarship pages; `key` picks the title/description under scholarships.meta. */
export async function scholarshipMetadata(key: "landing" | "apply" | "donate", path: string): Promise<Metadata> {
  const t = await getTranslations("scholarships.meta")
  const locale = await getLocale()
  const title = t(`${key}Title`)
  const description = t(`${key}Description`)
  return {
    title,
    description,
    alternates: localizedAlternates(path, locale),
    openGraph: {
      type: "website",
      url: localizedUrl(path, locale),
      title: `${title} | ${brandName(locale)}`,
      description,
      siteName: brandName(locale),
      locale: ogLocale(locale),
      images: [defaultOgImage(locale)],
    },
  }
}
