"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { CoursesService } from "@/lib/api"
import type { CourseResponse } from "@/lib/api"
import { Navbar } from "@/components/Navbar"
import Link from "next/link"
import { Loader2, BookOpen, GraduationCap, Users } from "lucide-react"

interface InstructorProfile {
  name: string
  courseCount: number
  courses: CourseResponse[]
}

function deriveInstructors(courses: CourseResponse[]): InstructorProfile[] {
  const map = new Map<string, InstructorProfile>()
  for (const course of courses) {
    const name = course.instructor
    if (!name) continue
    const existing = map.get(name)
    if (existing) {
      existing.courses.push(course)
      existing.courseCount++
    } else {
      map.set(name, { name, courseCount: 1, courses: [course] })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.courseCount - a.courseCount)
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const GRADIENT_VARIANTS = [
  "bg-brand",
  "bg-brand",
  "bg-brand",
  "bg-brand",
  "bg-brand",
  "bg-brand",
]

export default function InstructorsPage() {
  const t = useTranslations("instructors")
  const [instructors, setInstructors] = useState<InstructorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const page = await CoursesService.getActiveCourses({})
        setInstructors(deriveInstructors(page.content ?? []))
      } catch (err) {
        console.error("Failed to fetch instructors", err)
        setError(t("noInstructorsDesc"))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      {/* Hero */}
      <section className="bg-surface border-b border-line-strong pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-subtle text-brand rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            {t("meetOurTeam")}
          </div>
          <h1 className="text-4xl font-bold text-ink mb-3">{t("title")}</h1>
          <p className="text-lg text-ink-2 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-brand animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-danger py-12">{error}</div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-on-night-2 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-ink mb-2">{t("noInstructors")}</h3>
            <p className="text-ink-3">{t("noInstructorsDesc")}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-3 mb-6">
              {instructors.length} {t("courses")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((instructor, index) => {
                const gradient = GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]
                return (
                  <div
                    key={instructor.name}
                    className="bg-surface rounded-2xl border border-line-strong shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card header */}
                    <div className={`${gradient} px-6 py-6`}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-night-2 border-2 border-night-2 flex items-center justify-center text-on-night text-xl font-bold shrink-0 select-none">
                          {getInitials(instructor.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-on-night leading-tight">
                            {instructor.name}
                          </h3>
                          <div className="flex items-center gap-1 text-on-night text-sm mt-0.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {instructor.courseCount} {t("courses")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Courses list */}
                    <div className="p-4">
                      <p className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2">
                        {t("courses")}
                      </p>
                      <ul className="space-y-1.5">
                        {instructor.courses.slice(0, 3).map((course) => (
                          <li key={course.id}>
                            <Link
                              href={`/courses/${course.id}`}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-subtle transition-colors group"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-coral shrink-0 mt-0.5" />
                              <span className="text-sm text-ink-button group-hover:text-brand line-clamp-1">
                                {course.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {instructor.courses.length > 3 && (
                          <li className="text-xs text-ink-3 ps-2 pt-1">
                            +{instructor.courses.length - 3} {t("courses")}
                          </li>
                        )}
                      </ul>

                      {/* CTA */}
                      <Link
                        href={`/courses?instructor=${encodeURIComponent(instructor.name)}`}
                        className="mt-4 flex items-center justify-center w-full py-2 px-4 rounded-xl border border-line-strong text-sm font-medium text-ink-2 hover:bg-subtle hover:border-brand hover:text-brand transition-colors"
                      >
                        {t("viewAllCourses")}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
