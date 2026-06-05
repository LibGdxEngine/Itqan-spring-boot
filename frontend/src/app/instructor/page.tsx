"use client"

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { CourseResponse, CoursesService } from "@/lib/api"
import {
  uploadCourseThumbnail,
  validateThumbnailFile,
} from "@/lib/courseThumbnail"
import { ImageIcon, Loader2, Plus, LayoutDashboard, Film, Trash2 } from "lucide-react"
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
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api-axios"

export default function InstructorDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [courses, setCourses] = useState<CourseResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingThumbnailId, setUpdatingThumbnailId] = useState<number | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<CourseResponse | null>(null)
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const targetCourseIdRef = useRef<number | null>(null)
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()

  const fetchInstructorCourses = useCallback(async () => {
    try {
      const response = await api.get<{ content: CourseResponse[] } | CourseResponse[]>("/api/courses/mine")
      const data = response.data
      setCourses(Array.isArray(data) ? data : data?.content ?? [])
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

  const startThumbnailChange = (courseId: number) => {
    targetCourseIdRef.current = courseId
    fileInputRef.current?.click()
  }

  const onThumbnailFilePicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const courseId = targetCourseIdRef.current
    event.target.value = ""
    targetCourseIdRef.current = null
    if (!file || courseId == null) return

    const validation = validateThumbnailFile(file)
    if (!validation.ok) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          validation.reason === "size"
            ? t("instructor.thumbnailTooLarge") || "Image is larger than 5 MB."
            : t("instructor.thumbnailUnsupportedType") || "Use JPEG, PNG, or WebP.",
      })
      return
    }

    const course = courses.find((c) => c.id === courseId)
    if (!course) return

    setUpdatingThumbnailId(courseId)
    try {
      const uploaded = await uploadCourseThumbnail(file)
      await CoursesService.updateCourse(courseId, {
        title: course.title ?? "",
        description: course.description,
        instructor: course.instructor ?? "",
        price: course.price ?? 0,
        duration: course.duration ?? 0,
        level: course.level ?? "BEGINNER",
        category: course.category ?? "GENERAL",
        thumbnailUrl: uploaded.url,
        tags: course.tags,
      })
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, thumbnailUrl: uploaded.url } : c,
        ),
      )
      toast({
        title: t("instructor.thumbnailUpdated") || "Thumbnail updated",
      })
    } catch (error) {
      console.error("Failed to update thumbnail", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          t("instructor.thumbnailUploadFailed") ||
          "Couldn't upload the thumbnail. Try a different image.",
      })
    } finally {
      setUpdatingThumbnailId(null)
    }
  }

  const handleDeleteCourse = async () => {
    if (courseToDelete?.id == null) return
    setIsDeletingCourse(true)
    try {
      await CoursesService.deleteCourse(courseToDelete.id)
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id))
      setCourseToDelete(null)
      toast({ title: t("instructor.courseDeleted") || "Course deleted" })
    } catch (error) {
      console.error("Failed to delete course", error)
      toast({ variant: "destructive", title: "Error", description: t("instructor.courseDeleteFailed") || "Failed to delete course" })
    } finally {
      setIsDeletingCourse(false)
    }
  }

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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onThumbnailFilePicked}
      />
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("instructor.createCourse") || "Create New Course"}</DialogTitle>
            </DialogHeader>
            <CourseCreatorForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const isUpdating = updatingThumbnailId === course.id
          return (
          <div key={course.id} className="bg-[#faf9f5] rounded-xl border border-[#f0eee6] shadow-[0_0_0_1px_#f0eee6] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-shadow">
            <div className="relative group">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title || ""}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-[#f0eee6] text-[#87867f]">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUpdating || course.id == null}
                onClick={() => course.id != null && startThumbnailChange(course.id)}
                className="absolute bottom-2 right-2 gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              >
                {isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ImageIcon className="w-3 h-3" />
                )}
                {t("instructor.changeThumbnail") || "Change thumbnail"}
              </Button>
            </div>

            <div className="p-5">
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

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/instructor/courses/${course.id}/lessons`}>
                      <Film className="w-4 h-4 mr-2" />
                      {t("instructor.manageContent") || "Manage Content"}
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-[#b53333] hover:bg-[#f4e3e3] hover:text-[#b53333]"
                    title={t("instructor.deleteCourse") || "Delete course"}
                    onClick={() => setCourseToDelete(course)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          )
        })}

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
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

    <Dialog open={!!courseToDelete} onOpenChange={(open) => !open && !isDeletingCourse && setCourseToDelete(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("instructor.deleteCourse") || "Delete course"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#5e5d59]">
          {t("instructor.deleteCourseConfirm") || "Are you sure you want to delete this course? All modules, lessons, and enrollments will be permanently removed."}
          {courseToDelete?.title ? ` (${courseToDelete.title})` : ""}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCourseToDelete(null)} disabled={isDeletingCourse}>
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            className="bg-[#b53333] text-white hover:bg-[#9e2c2c]"
            onClick={() => void handleDeleteCourse()}
            disabled={isDeletingCourse}
          >
            {isDeletingCourse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.delete") || "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </div>
  )
}
