"use client"

import { CurriculumBoard } from "@/components/studio/CurriculumBoard"
import { useCourseStudio } from "@/components/studio/course-context"

export default function CourseCurriculumPage() {
  const { course, setCourse, reload } = useCourseStudio()
  return (
    <CurriculumBoard
      course={course}
      reload={reload}
      onCourseChange={(modules) => setCourse((current) => (current ? { ...current, modules } : current))}
    />
  )
}
