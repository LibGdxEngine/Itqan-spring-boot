"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"

import { PageHeader } from "@/components/admin/ui"
import { CourseDetailsForm } from "@/components/studio/CourseDetailsForm"
import { StudioShell } from "@/components/studio/StudioShell"

export default function NewCoursePage() {
  const t = useTranslations("studio.newCourse")
  const router = useRouter()

  return (
    <StudioShell>
      <Link href="/instructor" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("back")}
      </Link>
      <PageHeader title={t("title")} description={t("description")} />
      <CourseDetailsForm onSaved={(course) => router.push(`/instructor/courses/${course.id}/lessons`)} />
    </StudioShell>
  )
}
