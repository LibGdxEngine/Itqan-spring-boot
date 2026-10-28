"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { BookOpen, ImageIcon, Percent, Plus, Trash2, TrendingUp, Users, Wallet } from "lucide-react"

import { Badge, ConfirmDialog, PageHeader, StatCard, formatMoney } from "@/components/admin/ui"
import { StudioShell, useSiteCurrency } from "@/components/studio/StudioShell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { InstructorOverview, StudioCourse, instructorAnalyticsApi, studioApi } from "@/lib/studio-api"

function formatRevenue(byCurrency: Record<string, number> | undefined, fallback: string, locale: string) {
  const entries = Object.entries(byCurrency ?? {})
  if (entries.length === 0) return formatMoney(0, fallback, locale)
  return entries.map(([currency, amount]) => formatMoney(amount, currency, locale)).join(" · ")
}

function StudioHome() {
  const t = useTranslations("studio.home")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const currency = useSiteCurrency()
  const { toast } = useToast()
  const [courses, setCourses] = React.useState<StudioCourse[] | null>(null)
  const [overview, setOverview] = React.useState<InstructorOverview | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [toDelete, setToDelete] = React.useState<StudioCourse | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    studioApi
      .myCourses()
      .then(setCourses)
      .catch((err) => setError(getErrorMessage(err)))
    instructorAnalyticsApi
      .overview({})
      .then(setOverview)
      .catch(() => setOverview(null))
  }, [])

  const statsById = new Map(overview?.courses.map((c) => [c.courseId, c]) ?? [])

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await studioApi.deleteCourse(toDelete.id)
      setCourses((list) => list?.filter((c) => c.id !== toDelete.id) ?? null)
      setToDelete(null)
      toast({ title: t("deleted") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild>
            <Link href="/instructor/courses/new">
              <Plus /> {t("newCourse")}
            </Link>
          </Button>
        }
      />

      {overview ? (
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label={t("kpi.students")} value={overview.summary.totalStudents.toLocaleString(locale)} icon={<Users className="h-4 w-4" />} />
          <StatCard
            label={t("kpi.newEnrollments")}
            value={overview.summary.newEnrollments.toLocaleString(locale)}
            hint={t("kpi.last30")}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            label={t("kpi.revenue")}
            value={formatRevenue(overview.summary.revenueByCurrency, currency, locale)}
            hint={t("kpi.last30")}
            icon={<Wallet className="h-4 w-4" />}
          />
          <StatCard
            label={t("kpi.progress")}
            value={`${Math.round(overview.summary.averageProgress)}%`}
            icon={<Percent className="h-4 w-4" />}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : courses === null ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-subtle" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line-strong px-6 py-14 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-brand" />
          <p className="mt-3 text-lg font-semibold text-ink">{t("emptyTitle")}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">{t("emptyDescription")}</p>
          <Button className="mt-5" asChild>
            <Link href="/instructor/courses/new">
              <Plus /> {t("newCourse")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const stats = statsById.get(course.id)
            const lessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
            return (
              <li key={course.id} className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <Link href={`/instructor/courses/${course.id}/lessons`} className="block">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-subtle text-ink-3">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <Link href={`/instructor/courses/${course.id}/lessons`} className="line-clamp-2 font-semibold text-ink hover:text-brand">
                      {course.title}
                    </Link>
                    {course.active ? <Badge tone="green">{t("published")}</Badge> : <Badge tone="amber">{t("draft")}</Badge>}
                  </div>
                  <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs text-ink-3">
                    <div>
                      <dt>{t("students")}</dt>
                      <dd className="text-base font-semibold text-ink" dir="ltr">{stats?.students ?? 0}</dd>
                    </div>
                    <div>
                      <dt>{t("lessons")}</dt>
                      <dd className="text-base font-semibold text-ink" dir="ltr">{lessons}</dd>
                    </div>
                    <div>
                      <dt>{t("price")}</dt>
                      <dd className="text-base font-semibold text-ink">
                        {course.price > 0 ? formatMoney(course.price, currency, locale) : t("free")}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link href={`/instructor/courses/${course.id}/lessons`}>{t("edit")}</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/instructor/courses/${course.id}/analytics`}>{t("insights")}</Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-danger hover:bg-danger-soft hover:text-danger"
                      aria-label={t("delete")}
                      onClick={() => setToDelete(course)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription", { title: toDelete?.title ?? "" })}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        destructive
        busy={deleting}
        onConfirm={() => void remove()}
      />
    </>
  )
}

export default function InstructorStudioPage() {
  return (
    <StudioShell>
      <StudioHome />
    </StudioShell>
  )
}
