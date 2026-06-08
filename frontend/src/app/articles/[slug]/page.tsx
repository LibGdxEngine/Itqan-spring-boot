"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, AlertCircle, Clock, Newspaper } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { MarkdownRenderer } from "@/components/articles/MarkdownRenderer"
import { articlesApi, type Article } from "@/lib/articles"

export default function ArticleDetailPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4ed]">
        <Loader2 className="h-10 w-10 animate-spin text-[#c96442]" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex h-[80vh] flex-col items-center justify-center px-4 text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-[#141413]">
            {t("articles.notFoundTitle")}
          </h1>
          <p className="text-[#5e5d59]">
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
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        {article.coverImageUrl ? (
          <div className="mb-8 h-56 w-full overflow-hidden rounded-2xl bg-[#c96442] sm:h-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-8 flex h-56 w-full items-center justify-center rounded-2xl bg-[#c96442] sm:h-80">
            <Newspaper className="h-20 w-20 text-[#faf9f5] opacity-80" />
          </div>
        )}

        {article.category ? (
          <span className="mb-3 inline-flex rounded-full bg-[#f0eee6] px-2.5 py-1 text-xs font-semibold text-[#c96442]">
            {article.category}
          </span>
        ) : null}

        <h1
          className="text-3xl text-[#141413] sm:text-4xl"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {article.title}
        </h1>

        {article.description ? (
          <p className="mt-4 text-lg leading-relaxed text-[#5e5d59]">
            {article.description}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#e8e6dc] pb-6 text-sm text-[#87867f] ltr-flex">
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
