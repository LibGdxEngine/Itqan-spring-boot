"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Select } from "@/components/admin/ui"
import { CourseOption, adminCoursesApi } from "@/lib/admin-api"

let cachedOptions: Promise<CourseOption[]> | null = null

/** All courses for pickers; fetched once per page load and shared between selects. */
export function useCourseOptions() {
  const [options, setOptions] = React.useState<CourseOption[]>([])
  React.useEffect(() => {
    cachedOptions ??= adminCoursesApi.options().catch((err) => {
      cachedOptions = null
      throw err
    })
    cachedOptions.then(setOptions).catch(() => setOptions([]))
  }, [])
  return options
}

export function CourseSelect({
  value,
  onChange,
  allLabel,
  required,
  id,
  className,
}: {
  value: number | ""
  onChange: (value: number | "") => void
  /** When set, adds an empty "all courses" option with this label. */
  allLabel?: string
  required?: boolean
  id?: string
  className?: string
}) {
  const t = useTranslations("admin.common")
  const options = useCourseOptions()
  return (
    <Select
      id={id}
      required={required}
      className={className}
      aria-label={t("course")}
      value={value === "" ? "" : String(value)}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
    >
      <option value="">{allLabel ?? t("chooseCourse")}</option>
      {options.map((course) => (
        <option key={course.id} value={course.id}>
          {course.title}
          {course.active ? "" : ` (${t("draft")})`}
        </option>
      ))}
    </Select>
  )
}
