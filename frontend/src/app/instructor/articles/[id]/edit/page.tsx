"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, AlertCircle } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { ArticleEditorForm } from "@/components/articles/ArticleEditorForm"
import { articlesApi, type Article } from "@/lib/articles"

export default function EditArticlePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const t = useTranslations()

  const id = Number(params.id)
  const isAllowed = user?.role === "INSTRUCTOR" || user?.role === "ADMIN"

  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticle = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError(t("articles.notFoundDesc"))
      setLoading(false)
      return
    }
    try {
      const data = await articlesApi.getById(id)
      setArticle(data)
    } catch (err) {
      console.error("Failed to load article", err)
      setError(t("articles.notFoundDesc"))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isAllowed) {
      router.push("/dashboard")
    } else {
      void fetchArticle()
    }
  }, [authLoading, isAuthenticated, isAllowed, router, fetchArticle])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
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
          <p className="text-ink-2">{error || t("articles.notFoundDesc")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <h1
          className="mb-8 text-3xl text-ink"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {t("articles.editArticle")}
        </h1>
        <ArticleEditorForm mode="edit" initial={article} />
      </main>
    </div>
  )
}
