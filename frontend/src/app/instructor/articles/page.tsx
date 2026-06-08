"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Newspaper,
  Clock,
  Eye,
} from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { articlesApi, type Article } from "@/lib/articles"

export default function InstructorArticlesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAllowed = user?.role === "INSTRUCTOR" || user?.role === "ADMIN"

  const fetchMine = useCallback(async () => {
    try {
      const data = await articlesApi.listMine()
      setArticles(data)
    } catch (error) {
      console.error("Failed to fetch articles", error)
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description: getErrorMessage(error),
      })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isAllowed) {
      router.push("/dashboard")
    } else {
      void fetchMine()
    }
  }, [authLoading, isAuthenticated, isAllowed, router, fetchMine])

  const handleDelete = async () => {
    if (!articleToDelete) return
    setDeleting(true)
    try {
      await articlesApi.remove(articleToDelete.id)
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id))
      setArticleToDelete(null)
      toast({ title: t("articles.deletedSuccess") })
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("articles.errorTitle"),
        description: getErrorMessage(error),
      })
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-24">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="flex items-center gap-2 text-2xl sm:text-3xl text-[#141413]"
              style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
            >
              <Newspaper className="h-8 w-8 text-[#c96442]" />
              {t("articles.manageArticles")}
            </h1>
          </div>
          <Button asChild className="gap-2">
            <Link href="/instructor/articles/new">
              <Plus className="h-4 w-4" />
              {t("articles.newArticle")}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="overflow-hidden rounded-xl border border-[#f0eee6] bg-[#faf9f5] shadow-[0_0_0_1px_#f0eee6] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
            >
              <div className="aspect-video w-full overflow-hidden bg-[#c96442]">
                {article.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.coverImageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Newspaper className="h-10 w-10 text-[#faf9f5] opacity-80" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3
                    className="line-clamp-1 text-lg text-[#141413]"
                    style={{
                      fontFamily: "var(--font-serif-ar)",
                      fontWeight: 500,
                    }}
                    title={article.title}
                  >
                    {article.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      article.published
                        ? "bg-[#e8e6dc] text-[#4d4c48]"
                        : "bg-[#f0eee6] text-[#87867f]"
                    }`}
                  >
                    {article.published
                      ? t("articles.active")
                      : t("articles.draft")}
                  </span>
                </div>

                {article.description ? (
                  <p className="mb-4 line-clamp-2 text-sm text-[#87867f]">
                    {article.description}
                  </p>
                ) : null}

                <div className="mt-4 flex items-center justify-between border-t border-[#f0eee6] pt-4">
                  <div className="flex items-center gap-1 text-sm text-[#87867f]">
                    <Clock className="h-3.5 w-3.5" />
                    {t("articles.readingTime", {
                      minutes: article.readingTimeMinutes,
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    {article.published ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link
                          href={`/articles/${article.slug}`}
                          title={t("articles.preview")}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/instructor/articles/${article.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("articles.edit")}
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-[#b53333] hover:bg-[#f4e3e3] hover:text-[#b53333]"
                      title={t("articles.deleteArticle")}
                      onClick={() => setArticleToDelete(article)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {articles.length === 0 ? (
            <div className="col-span-full rounded-xl border-2 border-dashed border-[#e8e6dc] py-12 text-center">
              <p className="mb-4 text-[#87867f]">{t("articles.noArticles")}</p>
              <Button asChild variant="outline">
                <Link href="/instructor/articles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("articles.createArticle")}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog
        open={!!articleToDelete}
        onOpenChange={(open) => !open && !deleting && setArticleToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("articles.deleteArticle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#5e5d59]">
            {t("articles.deleteConfirm")}
            {articleToDelete?.title ? ` (${articleToDelete.title})` : ""}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setArticleToDelete(null)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-[#b53333] text-white hover:bg-[#9e2c2c]"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
