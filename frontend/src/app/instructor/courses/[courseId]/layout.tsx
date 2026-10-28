"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft, ExternalLink, EyeOff, ImageIcon, Loader2, Rocket } from "lucide-react"

import { Badge, ConfirmDialog } from "@/components/admin/ui"
import { CourseStudioContext } from "@/components/studio/course-context"
import { StudioShell, StudioSpinner, useStudioGuard } from "@/components/studio/StudioShell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { StudioCourse, studioApi } from "@/lib/studio-api"
import { cn } from "@/lib/utils"

const TABS = [
  { segment: "lessons", key: "curriculum" },
  { segment: "settings", key: "details" },
  { segment: "analytics", key: "analytics" },
] as const

function CourseStudio({ courseId, children }: { courseId: number; children: React.ReactNode }) {
  const t = useTranslations("studio.course")
  const tc = useTranslations("admin.common")
  const pathname = usePathname()
  const { toast } = useToast()
  const { user } = useStudioGuard()
  const [course, setCourse] = React.useState<StudioCourse | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false)

  const reload = React.useCallback(async () => {
    try {
      setCourse(await studioApi.getCourse(courseId))
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [courseId])

  React.useEffect(() => {
    void reload()
  }, [reload])

  const lessonCount = course?.modules.reduce((sum, m) => sum + m.lessons.length, 0) ?? 0
  const backHref = user?.role === "ADMIN" ? "/admin/courses" : "/instructor"

  const publish = async () => {
    if (!course) return
    setBusy(true)
    try {
      setCourse(await studioApi.publish(course.id))
      toast({ title: t("published") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const unpublish = async () => {
    if (!course) return
    setBusy(true)
    try {
      setCourse(await studioApi.unpublish(course.id))
      setConfirmUnpublish(false)
      toast({ title: t("unpublished") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft className="rtl:rotate-180" /> {t("back")}
          </Link>
        </Button>
      </div>
    )
  }
  if (!course) return <StudioSpinner />

  return (
    <CourseStudioContext.Provider value={{ course, setCourse, reload }}>
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
      </Link>

      <div className="mb-4 flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="hidden h-16 w-28 shrink-0 rounded-lg object-cover sm:block" />
          ) : (
            <div className="hidden h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-3 sm:flex">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold text-ink sm:text-2xl">{course.title}</h1>
              {course.active ? <Badge tone="green">{t("statusPublished")}</Badge> : <Badge tone="amber">{t("statusDraft")}</Badge>}
            </div>
            <p className="mt-1 text-sm text-ink-3">
              {t("counts", { modules: course.modules.length, lessons: lessonCount })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/courses/${course.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> {t("preview")}
            </Link>
          </Button>
          {course.active ? (
            <Button variant="outline" onClick={() => setConfirmUnpublish(true)} disabled={busy}>
              <EyeOff /> {t("unpublish")}
            </Button>
          ) : (
            <Button onClick={() => void publish()} disabled={busy || lessonCount === 0} title={lessonCount === 0 ? t("needLesson") : undefined}>
              {busy ? <Loader2 className="animate-spin" /> : <Rocket />} {t("publish")}
            </Button>
          )}
        </div>
      </div>

      {!course.active ? (
        <p className="mb-4 rounded-lg border border-warning-line bg-warning-soft px-4 py-2.5 text-sm text-warning">
          {lessonCount === 0 ? t("draftNeedsLesson") : t("draftHint")}
        </p>
      ) : null}

      <nav aria-label={t("tabsLabel")} className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-subtle p-1">
        {TABS.map((tab) => {
          const href = `/instructor/courses/${course.id}/${tab.segment}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={tab.segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-paper text-ink shadow-sm" : "text-ink-2 hover:text-ink",
              )}
            >
              {t(`tabs.${tab.key}`)}
            </Link>
          )
        })}
      </nav>

      {children}

      <ConfirmDialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        title={t("unpublishTitle")}
        description={t("unpublishDescription")}
        confirmLabel={t("unpublish")}
        cancelLabel={tc("cancel")}
        busy={busy}
        onConfirm={() => void unpublish()}
      />
    </CourseStudioContext.Provider>
  )
}

export default function CourseStudioLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ courseId: string }>()
  const courseId = Number(params.courseId)
  return (
    <StudioShell>
      {Number.isFinite(courseId) ? (
        <CourseStudio key={courseId} courseId={courseId}>
          {children}
        </CourseStudio>
      ) : null}
    </StudioShell>
  )
}
