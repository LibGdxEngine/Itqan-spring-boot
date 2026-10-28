"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { Panel, StatCard } from "@/components/admin/ui"
import { useCourseStudio } from "@/components/studio/course-context"
import { LessonTypeIcon } from "@/components/studio/LessonDialog"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { getErrorMessage } from "@/lib/api-axios"
import { CourseAnalyticsDetail, instructorAnalyticsApi } from "@/lib/studio-api"

export default function CourseAnalyticsPage() {
  const t = useTranslations("studio.courseAnalytics")
  const { course } = useCourseStudio()
  const [data, setData] = React.useState<CourseAnalyticsDetail | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    instructorAnalyticsApi
      .course(course.id)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
  }, [course.id])

  if (error) {
    return <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
  }
  if (!data) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  const pct = (count: number) => (data.students > 0 ? Math.round((count / data.students) * 100) : 0)
  const finished = data.lessons.length > 0 ? data.lessons[data.lessons.length - 1].completed : 0
  const attempts = data.quizzes.reduce((sum, q) => sum + q.attempts, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("students")} value={data.students} />
        <StatCard label={t("reachedEnd")} value={`${pct(finished)}%`} hint={t("reachedEndHint")} />
        <StatCard label={t("quizAttempts")} value={attempts} />
      </div>

      <Panel title={t("funnel")}>
        {data.lessons.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-3">{t("noLessons")}</p>
        ) : (
          <>
            <p className="px-4 pt-3 text-sm text-ink-2">{t("funnelHint")}</p>
            <ol className="space-y-2 p-4">
              {data.lessons.map((lesson, index) => {
                const value = pct(lesson.completed)
                return (
                  <li key={lesson.lessonId} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 sm:grid-cols-[1.5rem_minmax(0,16rem)_1fr_7rem]">
                    <span className="text-xs text-ink-3" dir="ltr">{index + 1}</span>
                    <span className="flex min-w-0 items-center gap-1.5 text-sm text-ink">
                      <LessonTypeIcon type={lesson.type} className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                      <span className="truncate" title={`${lesson.moduleTitle} · ${lesson.title}`}>{lesson.title}</span>
                    </span>
                    <div
                      className="col-start-2 mt-1 h-3 overflow-hidden rounded-full bg-grid sm:col-start-auto sm:mt-0"
                      role="meter"
                      aria-valuenow={value}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={lesson.title}
                    >
                      <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${value}%` }} />
                    </div>
                    <span className="col-start-2 text-xs text-ink-2 sm:col-start-auto sm:text-end" dir="ltr">
                      {value}% · {lesson.completed}/{data.students}
                    </span>
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </Panel>

      <Panel title={t("quizzes")}>
        {data.quizzes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-3">{t("noQuizzes")}</p>
        ) : (
          <ResponsiveTable
            rows={data.quizzes}
            getRowKey={(row) => row.quizId}
            columns={[
              { header: t("cols.quiz"), cell: (row) => <span className="font-medium text-ink">{row.title}</span> },
              { header: t("cols.lesson"), cell: (row) => row.lessonTitle },
              { header: t("cols.questions"), cell: (row) => <span dir="ltr">{row.questions}</span> },
              { header: t("cols.attempts"), cell: (row) => <span dir="ltr">{row.attempts}</span> },
              {
                header: t("cols.average"),
                cell: (row) => <span dir="ltr">{row.averageScore == null ? "—" : `${Math.round(row.averageScore)}%`}</span>,
              },
              {
                header: t("cols.passRate"),
                cell: (row) => <span dir="ltr">{row.passRate == null ? "—" : `${Math.round(row.passRate)}%`}</span>,
              },
            ]}
          />
        )}
      </Panel>
    </div>
  )
}
