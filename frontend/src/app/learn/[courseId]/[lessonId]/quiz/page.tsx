"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, Loader2 } from "lucide-react"

import { QuizPlayer } from "@/components/quiz/QuizPlayer"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { LessonResponse, LessonsService, OpenAPI, QuizManagementService, QuizResponse } from "@/lib/api"

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

type LessonWithQuiz = LessonResponse & { quizId?: number }

export default function QuizPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const lessonId = Number(params.lessonId)
  const t = useTranslations()
  const { toast } = useToast()

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!lessonId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const lesson = (await LessonsService.getLessonById(lessonId)) as LessonWithQuiz
        if (cancelled) return
        if (!lesson.quizId) {
          setError(t("quiz.page.noQuiz"))
          return
        }
        const quizData = await QuizManagementService.getQuiz(lesson.quizId)
        if (cancelled) return
        setQuiz(quizData)
      } catch (err) {
        const message = getErrorMessage(err)
        if (cancelled) return
        setError(message)
        toast({
          title: t("quiz.page.loadFailed"),
          description: message,
          variant: "destructive",
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [lessonId, t, toast])

  const backHref = `/learn/${courseId}/${lessonId}`

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t("quiz.page.backToLesson")}
      </Link>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-line bg-surface p-10">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger-line bg-brand-soft p-4 text-sm text-danger">
          {error}
        </div>
      ) : quiz ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-2 text-sm text-ink-2">{quiz.description}</p>
            )}
          </div>
          <QuizPlayer quiz={quiz} backHref={backHref} />
        </div>
      ) : null}
    </div>
  )
}
