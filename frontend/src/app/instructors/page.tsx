"use client"

import { useEffect, useState } from "react"
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
  "from-emerald-500 to-emerald-700",
  "from-sky-500 to-sky-700",
  "from-violet-500 to-violet-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-teal-500 to-teal-700",
]

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courses = await CoursesService.getActiveCourses()
        setInstructors(deriveInstructors(courses))
      } catch (err) {
        console.error("Failed to fetch instructors", err)
        setError("Failed to load instructors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Meet Our Team
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Our Instructors</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Learn from experienced educators and industry professionals dedicated to helping you succeed.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No instructors found</h3>
            <p className="text-slate-500">Check back soon as we continue to grow our instructor community.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {instructors.length} instructor{instructors.length !== 1 ? "s" : ""} teaching on Itqan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((instructor, index) => {
                const gradient = GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]
                return (
                  <div
                    key={instructor.name}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card header */}
                    <div className={`bg-gradient-to-br ${gradient} px-6 py-6`}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
                          {getInitials(instructor.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white leading-tight">
                            {instructor.name}
                          </h3>
                          <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {instructor.courseCount} course{instructor.courseCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Courses list */}
                    <div className="p-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Courses
                      </p>
                      <ul className="space-y-1.5">
                        {instructor.courses.slice(0, 3).map((course) => (
                          <li key={course.id}>
                            <Link
                              href={`/courses/${course.id}`}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-700 group-hover:text-emerald-600 line-clamp-1">
                                {course.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {instructor.courses.length > 3 && (
                          <li className="text-xs text-slate-400 pl-2 pt-1">
                            +{instructor.courses.length - 3} more course
                            {instructor.courses.length - 3 !== 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>

                      {/* CTA */}
                      <Link
                        href={`/courses?instructor=${encodeURIComponent(instructor.name)}`}
                        className="mt-4 flex items-center justify-center w-full py-2 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                      >
                        View All Courses
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
