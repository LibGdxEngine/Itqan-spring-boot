"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { CourseResponse } from "@/lib/api"
import { Loader2, Plus, LayoutDashboard, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CourseCreatorForm } from "@/components/instructor/CourseCreatorForm"
import { CouponManager } from "@/components/instructor/CouponManager"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTranslations } from "next-intl"
import api from "@/lib/api-axios"

export default function InstructorDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const t = useTranslations()

  const fetchInstructorCourses = useCallback(async () => {
    try {
      const response = await api.get<CourseResponse[]>("/api/courses/mine")
      setCourses(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch courses", error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    } else if (!authLoading && user?.role !== 'INSTRUCTOR') {
      router.push("/dashboard") // Redirect non-instructors
    } else if (isAuthenticated && user?.role === 'INSTRUCTOR') {
      const timer = window.setTimeout(() => {
        fetchInstructorCourses()
      }, 0)
      return () => window.clearTimeout(timer)
    }
  }, [isAuthenticated, user, authLoading, router, fetchInstructorCourses])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
    <div className="container max-w-7xl mx-auto px-4 pt-24 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#141413] flex items-center gap-2" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
            <LayoutDashboard className="w-8 h-8 text-[#c96442]" />
            {t("instructor.dashboard") || "Instructor Dashboard"}
          </h1>
          <p className="text-[#5e5d59] mt-2">
            {t("instructor.welcome", { name: user?.firstName || "" }) || "Manage your courses and content."}
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {t("instructor.createCourse") || "Create New Course"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{t("instructor.createCourse") || "Create New Course"}</DialogTitle>
            </DialogHeader>
            <CourseCreatorForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-[#faf9f5] rounded-xl border border-[#f0eee6] shadow-[0_0_0_1px_#f0eee6] p-5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <h3 className="text-lg line-clamp-1 text-[#141413]" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }} title={course.title}>
                 {course.title}
               </h3>
               <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.active ? 'bg-[#e8e6dc] text-[#4d4c48]' : 'bg-[#f0eee6] text-[#87867f]'}`}>
                 {course.active ? (t("common.active") || "Active") : (t("common.draft") || "Draft")}
               </span>
            </div>

            <p className="text-sm text-[#87867f] mb-4 line-clamp-2">
              {course.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between mt-4 border-t border-[#f0eee6] pt-4">
              <div className="text-sm text-[#87867f]">
                 {course.modules?.length || 0} {t("common.modules") || "Modules"}
              </div>
              
              <Button variant="outline" size="sm" asChild>
                <Link href={`/instructor/courses/${course.id}/lessons`}>
                  <Film className="w-4 h-4 mr-2" />
                  {t("instructor.manageContent") || "Manage Content"}
                </Link>
              </Button>
            </div>
          </div>
        ))}
        
        {courses.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-[#e8e6dc] rounded-xl">
                <p className="text-[#87867f] mb-4">{t("instructor.noCourses") || "You haven't created any courses yet."}</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("instructor.createFirstCourse") || "Create Your First Course"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                     <DialogHeader>
                       <DialogTitle>{t("instructor.createCourse") || "Create New Course"}</DialogTitle>
                     </DialogHeader>
                     <CourseCreatorForm />
                   </DialogContent>
                </Dialog>
            </div>
        )}
      </div>

      <div className="mt-10">
        <CouponManager />
      </div>
    </div>
    </div>
  )
}
