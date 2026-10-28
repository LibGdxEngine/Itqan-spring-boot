"use client"

import * as React from "react"

import type { StudioCourse } from "@/lib/studio-api"

interface CourseStudioContextValue {
  course: StudioCourse
  setCourse: React.Dispatch<React.SetStateAction<StudioCourse | null>>
  reload: () => Promise<void>
}

export const CourseStudioContext = React.createContext<CourseStudioContextValue | null>(null)

/** The course being edited, loaded once by the course studio layout. */
export function useCourseStudio() {
  const value = React.useContext(CourseStudioContext)
  if (!value) throw new Error("useCourseStudio must be used inside the course studio layout")
  return value
}
