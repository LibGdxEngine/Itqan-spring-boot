import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"

import type { Article } from "@/lib/articles"
import ArticleDetailClient from "../_components/ArticleDetailClient"
import { brandName, defaultOgImage, jsonLdHtml, LOGO_URL, ogLocale } from "@/lib/seo"

const API_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/articles/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    )
    if (!res.ok) return null
    return (await res.json()) as Article
  } catch {
    return null
  }
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/~~(.*?)~~/g, "$1") // strikethrough
    .replace(/<[^>]+>/g, " ") // html tags
    .replace(/[#*_~>`-]/g, " ") // stray markdown chars
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
}

function buildDescription(article: Article): string {
  const direct = article.description?.trim()
  if (direct) return direct
  const excerpt = stripMarkdown(article.content || "")
  return excerpt.length > 160 ? `${excerpt.slice(0, 157)}...` : excerpt
}

function absoluteImageUrl(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const locale = await getLocale()
  const article = await fetchArticle(slug)

  if (!article) {
    const fallback = await getTranslations({
      locale,
      namespace: "seo.articleFallback",
    })
    return {
      title: fallback("notFound"),
      description: fallback("description"),
      robots: { index: false, follow: false },
    }
  }

  const title = article.title
  const description = buildDescription(article)
  const canonical = `${SITE_URL}/articles/${encodeURIComponent(slug)}`
  const keywords = article.category ? [article.category] : undefined
  const images = article.coverImageUrl
    ? [{ url: absoluteImageUrl(article.coverImageUrl), alt: title }]
    : [{ ...defaultOgImage(locale), alt: title }]

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: brandName(locale),
      locale: ogLocale(locale),
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
      authors: article.authorName ? [article.authorName] : undefined,
      section: article.category ?? undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [images[0].url],
    },
  }
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: "seo.articles" })
  const article = await fetchArticle(slug)

  if (!article) {
    return <ArticleDetailClient />
  }

  const brand = brandName(locale)
  const canonical = `${SITE_URL}/articles/${encodeURIComponent(slug)}`
  const description = buildDescription(article)
  const coverImage = article.coverImageUrl
    ? absoluteImageUrl(article.coverImageUrl)
    : undefined

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    ...(coverImage ? { image: [coverImage] } : {}),
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt ?? undefined,
    author: {
      "@type": "Person",
      name: article.authorName || brand,
    },
    publisher: {
      "@type": "Organization",
      name: brand,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
    inLanguage: locale,
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.content
      ? { wordCount: article.content.trim().split(/\s+/).length }
      : {}),
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: brand,
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("title"),
        item: `${SITE_URL}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: canonical,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }}
      />
      <ArticleDetailClient />
    </>
  )
}
