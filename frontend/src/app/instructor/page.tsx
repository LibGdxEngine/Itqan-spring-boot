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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
    <div className="container max-w-7xl mx-auto px-4 pt-24 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-sky-600" />
            {t("instructor.dashboard") || "Instructor Dashboard"}
          </h1>
          <p className="text-slate-600 mt-2">
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
          <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-semibold text-lg line-clamp-1" title={course.title}>
                 {course.title}
               </h3>
               <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                 {course.active ? (t("common.active") || "Active") : (t("common.draft") || "Draft")}
               </span>
            </div>
            
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
              {course.description || "No description provided."}
            </p>
            
            <div className="flex items-center justify-between mt-4 border-t pt-4">
              <div className="text-sm text-slate-500">
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
            <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-slate-500 mb-4">{t("instructor.noCourses") || "You haven't created any courses yet."}</p>
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
