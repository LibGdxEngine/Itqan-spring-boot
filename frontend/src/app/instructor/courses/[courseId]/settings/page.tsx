"use client"

import { CourseDetailsForm } from "@/components/studio/CourseDetailsForm"
import { useCourseStudio } from "@/components/studio/course-context"

export default function CourseSettingsPage() {
  const { course, setCourse } = useCourseStudio()
  return <CourseDetailsForm key={course.updatedAt} course={course} onSaved={(saved) => setCourse(saved)} />
}
