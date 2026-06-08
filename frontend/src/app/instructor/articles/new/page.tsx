"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { ArticleEditorForm } from "@/components/articles/ArticleEditorForm"

export default function NewArticlePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()

  const isAllowed = user?.role === "INSTRUCTOR" || user?.role === "ADMIN"

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.push("/login")
    } else if (!isAllowed) {
      router.push("/dashboard")
    }
  }, [authLoading, isAuthenticated, isAllowed, router])

  if (authLoading || !isAuthenticated || !isAllowed) {
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
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:px-6">
        <h1
          className="mb-8 text-3xl text-[#141413]"
          style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}
        >
          {t("articles.createArticle")}
        </h1>
        <ArticleEditorForm mode="create" />
      </main>
    </div>
  )
}
