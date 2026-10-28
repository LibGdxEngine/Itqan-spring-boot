"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Award, BookOpen, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { MyCourse, certificatesApi } from "@/lib/learning-api"

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-grid"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function resumeHref(course: MyCourse) {
  return course.lastLessonId ? `/learn/${course.courseId}/${course.lastLessonId}` : `/learn/${course.courseId}`
}

export function EnrolledCourseCard({
  course,
  onCertificate,
}: {
  course: MyCourse
  onCertificate: (courseId: number, code: string) => void
}) {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const { toast } = useToast()
  const [claiming, setClaiming] = React.useState(false)
  const done = course.status === "COMPLETED"

  const claim = async () => {
    setClaiming(true)
    try {
      const certificate = await certificatesApi.claim(course.courseId)
      onCertificate(course.courseId, certificate.code)
      router.push(`/certificates/${certificate.code}`)
    } catch (err) {
      toast({ variant: "destructive", title: t("certificateNotYet"), description: getErrorMessage(err) })
    } finally {
      setClaiming(false)
    }
  }

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      <Link href={resumeHref(course)} className="relative block aspect-video bg-brand" tabIndex={-1} aria-hidden>
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-on-night" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-ink">
          <Link href={resumeHref(course)} className="hover:text-brand">
            {course.title}
          </Link>
        </h3>
        <p className="mb-3 text-sm text-ink-3">{course.instructor}</p>
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between text-xs text-ink-2">
            <span>{t("lessonsDone", { done: course.completedLessons, total: course.totalLessons })}</span>
            <span dir="ltr">{course.progress}%</span>
          </div>
          <ProgressBar value={course.progress} label={t("progressLabel", { title: course.title })} />
          {course.lastLessonTitle && !done ? (
            <p className="truncate pt-1 text-xs text-ink-3">{t("lastLesson", { title: course.lastLessonTitle })}</p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" className="flex-1" asChild>
            <Link href={resumeHref(course)}>
              {done ? t("review") : course.progress > 0 ? t("continue") : t("start")}
            </Link>
          </Button>
          {course.certificateCode ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/certificates/${course.certificateCode}`}>
                <Award /> {t("certificate")}
              </Link>
            </Button>
          ) : done ? (
            <Button size="sm" variant="outline" onClick={() => void claim()} disabled={claiming}>
              {claiming ? <Loader2 className="animate-spin" /> : <Award />} {t("getCertificate")}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
