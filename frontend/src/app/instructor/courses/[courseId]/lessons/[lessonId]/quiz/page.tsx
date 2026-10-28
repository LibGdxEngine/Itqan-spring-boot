"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"

import { useCourseStudio } from "@/components/studio/course-context"
import { QuizBuilder } from "@/components/studio/QuizBuilder"

export default function LessonQuizPage() {
  const t = useTranslations("studio.quiz")
  const params = useParams<{ lessonId: string }>()
  const router = useRouter()
  const lessonId = Number(params.lessonId)
  const { course, setCourse } = useCourseStudio()
  const lesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === lessonId)
  const backHref = `/instructor/courses/${course.id}/lessons`

  const setQuizId = (quizId: number | null) =>
    setCourse((current) =>
      current
        ? {
            ...current,
            modules: current.modules.map((m) => ({
              ...m,
              lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, quizId } : l)),
            })),
          }
        : current,
    )

  return (
    <div>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("backToCurriculum")}
      </Link>
      {lesson ? (
        <>
          <h2 className="mb-4 text-lg font-semibold text-ink">{t("heading", { title: lesson.title })}</h2>
          <QuizBuilder
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            quizId={lesson.quizId}
            onSaved={(quizId) => setQuizId(quizId)}
            onDeleted={() => {
              setQuizId(null)
              router.push(backHref)
            }}
          />
        </>
      ) : (
        <p className="text-sm text-ink-3">{t("lessonNotFound")}</p>
      )}
    </div>
  )
}
