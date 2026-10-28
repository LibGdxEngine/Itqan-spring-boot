"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2, Search } from "lucide-react"

import { Navbar } from "@/components/Navbar"
import { Input } from "@/components/ui/input"
import { ArticleCard } from "@/components/articles/ArticleCard"
import { articlesApi, type ArticleSummary } from "@/lib/articles"

export default function ArticlesListClient() {
  const t = useTranslations()
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const trimmed = query.trim()

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        if (trimmed) {
          const results = await articlesApi.search(trimmed)
          if (!cancelled) setArticles(results)
        } else {
          const page = await articlesApi.list()
          if (!cancelled) setArticles(page.content ?? [])
        }
      } catch (err) {
        console.error("Failed to load articles", err)
        if (!cancelled) setError(t("articles.loadFailed"))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, t])

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1
            className="text-3xl text-ink"
            style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
          >
            {t("articles.exploreTitle")}
          </h1>
          <p className="mt-2 text-ink-2">{t("articles.exploreSubtitle")}</p>
        </div>

        <div className="relative mb-8 max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("articles.searchPlaceholder")}
            className="ps-9"
          />
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-danger">{error}</div>
        ) : articles.length === 0 ? (
          <div className="py-12 text-center text-ink-3">
            {t("articles.noArticles")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article) => (
              <div key={article.id} className="h-full">
                <ArticleCard article={article} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
