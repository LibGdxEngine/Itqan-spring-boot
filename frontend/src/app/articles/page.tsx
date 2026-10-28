import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import ArticlesListClient from "./_components/ArticlesListClient"
import { localizedAlternates, jsonLdHtml } from "@/lib/seo"

const API_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

type ArticleListItem = {
  slug?: string
  title?: string
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "seo.articles" })
  const keywords = t("keywords")
    .split("|")
    .map((k) => k.trim())
    .filter(Boolean)
  const url = `${SITE_URL}/articles`
  const isAr = locale === "ar"

  return {
    title: t("title"),
    description: t("description"),
    keywords,
    alternates: localizedAlternates("/articles", locale),
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
    robots: { index: true, follow: true },
  }
}

async function fetchArticles(): Promise<ArticleListItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/articles?page=0&size=50`, {
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.content ?? [])
  } catch {
    return []
  }
}

export default async function ArticlesPage() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "seo.articles" })
  const articles = await fetchArticles()
  const url = `${SITE_URL}/articles`

  const itemListElements = articles.slice(0, 50).map((article, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url: `${SITE_URL}/articles/${article.slug}`,
    name: article.title,
  }))

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collectionpage`,
    url,
    name: t("title"),
    description: t("description"),
    inLanguage: locale,
    isPartOf: { "@id": `${SITE_URL}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemListElements.length,
      itemListElement: itemListElements,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <ArticlesListClient />
    </>
  )
}
