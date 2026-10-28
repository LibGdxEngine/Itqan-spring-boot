"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, AlertCircle, Clock, Newspaper } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { MarkdownRenderer } from "@/components/articles/MarkdownRenderer"
import { articlesApi, type Article } from "@/lib/articles"

export default function ArticleDetailClient() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : params.slug?.[0]
  const t = useTranslations()
  const locale = useLocale()

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    const fetchArticle = async () => {
      setLoading(true)
      try {
        const data = await articlesApi.getBySlug(slug)
        if (!cancelled) setArticle(data)
      } catch (err) {
        console.error("Failed to fetch article", err)
        if (!cancelled) setError(t("articles.notFoundDesc"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchArticle()
    return () => {
      cancelled = true
    }
  }, [slug, t])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-danger" />
          <h1 className="mb-2 text-2xl font-bold text-ink">
            {t("articles.notFoundTitle")}
          </h1>
          <p className="text-ink-2">
            {error || t("articles.notFoundDesc")}
          </p>
        </div>
      </div>
    )
  }

  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === "ar" ? "ar-EG" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : null

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        {article.coverImageUrl ? (
          <div className="mb-8 h-56 w-full overflow-hidden rounded-2xl bg-brand sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-8 flex h-56 w-full items-center justify-center rounded-2xl bg-brand sm:h-80">
            <Newspaper className="h-20 w-20 text-on-night opacity-80" />
          </div>
        )}

        {article.category ? (
          <span className="mb-3 inline-flex rounded-full bg-subtle px-2.5 py-1 text-xs font-semibold text-brand">
            {article.category}
          </span>
        ) : null}

        <h1
          className="text-3xl text-ink sm:text-4xl"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {article.title}
        </h1>

        {article.description ? (
          <p className="mt-4 text-lg leading-relaxed text-ink-2">
            {article.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line-strong pb-6 text-sm text-ink-3 ltr-flex">
          {article.authorName ? (
            <>
              <span>
                {t("articles.by")} {article.authorName}
              </span>
              <span aria-hidden>•</span>
            </>
          ) : null}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {t("articles.readingTime", {
              minutes: article.readingTimeMinutes,
            })}
          </span>
          {publishedLabel ? (
            <>
              <span aria-hidden>•</span>
              <span>{publishedLabel}</span>
            </>
          ) : null}
        </div>

        <div className="mt-8">
          <MarkdownRenderer content={article.content} />
        </div>
      </main>
    </div>
  )
}
