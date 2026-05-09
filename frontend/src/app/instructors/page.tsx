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
  "bg-[#c96442]",
  "bg-[#c96442]",
  "bg-[#c96442]",
  "bg-[#c96442]",
  "bg-[#c96442]",
  "bg-[#c96442]",
]

export default function InstructorsPage() {
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
        setError("Failed to load instructors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#faf9f5] border-b border-[#e8e6dc] pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#f0eee6] text-[#c96442] rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Meet Our Team
          </div>
          <h1 className="text-4xl font-bold text-[#141413] mb-3">Our Instructors</h1>
          <p className="text-lg text-[#5e5d59] max-w-2xl mx-auto">
            Learn from experienced educators and industry professionals dedicated to helping you succeed.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 text-[#c96442] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-[#b0aea5] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#141413] mb-2">No instructors found</h3>
            <p className="text-[#87867f]">Check back soon as we continue to grow our instructor community.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#87867f] mb-6">
              {instructors.length} instructor{instructors.length !== 1 ? "s" : ""} teaching on Itqan
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map((instructor, index) => {
                const gradient = GRADIENT_VARIANTS[index % GRADIENT_VARIANTS.length]
                return (
                  <div
                    key={instructor.name}
                    className="bg-[#faf9f5] rounded-2xl border border-[#e8e6dc] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Card header */}
                    <div className={`${gradient} px-6 py-6`}>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#30302e] border-2 border-[#30302e] flex items-center justify-center text-[#faf9f5] text-xl font-bold shrink-0 select-none">
                          {getInitials(instructor.name)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-[#faf9f5] leading-tight">
                            {instructor.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[#faf9f5] text-sm mt-0.5">
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
                      <p className="text-xs font-semibold text-[#87867f] uppercase tracking-wider mb-2">
                        Courses
                      </p>
                      <ul className="space-y-1.5">
                        {instructor.courses.slice(0, 3).map((course) => (
                          <li key={course.id}>
                            <Link
                              href={`/courses/${course.id}`}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#f0eee6] transition-colors group"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-[#d97757] shrink-0 mt-0.5" />
                              <span className="text-sm text-[#4d4c48] group-hover:text-[#c96442] line-clamp-1">
                                {course.title}
                              </span>
                            </Link>
                          </li>
                        ))}
                        {instructor.courses.length > 3 && (
                          <li className="text-xs text-[#87867f] pl-2 pt-1">
                            +{instructor.courses.length - 3} more course
                            {instructor.courses.length - 3 !== 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>

                      {/* CTA */}
                      <Link
                        href={`/courses?instructor=${encodeURIComponent(instructor.name)}`}
                        className="mt-4 flex items-center justify-center w-full py-2 px-4 rounded-xl border border-[#e8e6dc] text-sm font-medium text-[#5e5d59] hover:bg-[#f0eee6] hover:border-[#c96442] hover:text-[#c96442] transition-colors"
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
