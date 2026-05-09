"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Loader2, Plus, Trash2, Upload, Video } from "lucide-react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth-context"
import { LessonResponse, CourseResponse, CoursesService, ModulesService } from "@/lib/api"
import { reorderModuleLessons } from "@/lib/lessonVideoUploadService"
import { Button } from "@/components/ui/button"
import { LessonCreatorForm } from "@/components/instructor/LessonCreatorForm"
import { VideoUploader } from "@/components/instructor/VideoUploader"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface DragState {
  moduleId: number
  lessonId: number
}

function reorderLessonsInMemory(
  lessons: LessonResponse[],
  draggedLessonId: number,
  targetLessonId: number
): LessonResponse[] {
  const sourceIndex = lessons.findIndex((lesson) => lesson.id === draggedLessonId)
  const targetIndex = lessons.findIndex((lesson) => lesson.id === targetLessonId)

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return lessons
  }

  const cloned = [...lessons]
  const [moved] = cloned.splice(sourceIndex, 1)
  cloned.splice(targetIndex, 0, moved)

  return cloned
}

export default function CourseLessonsPage() {
  const params = useParams()
  const courseId = Number(params.courseId)
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [course, setCourse] = useState<CourseResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [newModuleName, setNewModuleName] = useState("")
  const [isCreatingModule, setIsCreatingModule] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [reorderingModuleId, setReorderingModuleId] = useState<number | null>(null)
  const router = useRouter()
  const t = useTranslations()
  const { toast } = useToast()

  const fetchCourse = useCallback(async () => {
    try {
      const data = await CoursesService.getCourseById(courseId)
      setCourse(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch course", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load course details",
      })
      router.push("/instructor")
    }
  }, [courseId, router, toast])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
      return
    }

    if (isAuthenticated && user?.role === "INSTRUCTOR" && courseId) {
      void fetchCourse()
    }
  }, [authLoading, courseId, fetchCourse, isAuthenticated, router, user])

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) return

    setIsCreatingModule(true)
    try {
      await ModulesService.createModule({
        courseId,
        title: newModuleName,
        orderIndex: (course?.modules?.length || 0) + 1,
      })
      setNewModuleName("")
      await fetchCourse()
      toast({ title: "Success", description: "Module created" })
    } catch (error) {
      console.error("Failed to create module", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create module",
      })
    } finally {
      setIsCreatingModule(false)
    }
  }

  const replaceModuleLessons = (moduleId: number, lessons: LessonResponse[]) => {
    setCourse((previousCourse) => {
      if (!previousCourse?.modules) return previousCourse

      return {
        ...previousCourse,
        modules: previousCourse.modules.map((module) => {
          if (module.id !== moduleId) return module
          return {
            ...module,
            lessons,
          }
        }),
      }
    })
  }

  const handleLessonDragStart = (moduleId: number, lessonId: number) => {
    setDragState({ moduleId, lessonId })
  }

  const handleLessonDragEnd = () => {
    setDragState(null)
  }

  const handleLessonDrop = async (moduleId: number, targetLessonId: number) => {
    if (!dragState || dragState.moduleId !== moduleId) {
      setDragState(null)
      return
    }

    const moduleData = course?.modules?.find((item) => item.id === moduleId)
    const lessons = moduleData?.lessons || []
    if (lessons.length <= 1) {
      setDragState(null)
      return
    }

    const reorderedLessons = reorderLessonsInMemory(lessons, dragState.lessonId, targetLessonId)
    const lessonIds = reorderedLessons
      .map((lesson) => lesson.id)
      .filter((id): id is number => typeof id === "number")

    if (lessonIds.length !== reorderedLessons.length) {
      setDragState(null)
      return
    }

    replaceModuleLessons(moduleId, reorderedLessons)
    setReorderingModuleId(moduleId)
    setDragState(null)

    try {
      const persistedLessons = await reorderModuleLessons(moduleId, lessonIds)
      replaceModuleLessons(moduleId, persistedLessons)
    } catch (error) {
      console.error("Failed to reorder lessons", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save lesson order",
      })
      await fetchCourse()
    } finally {
      setReorderingModuleId(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" className="mb-4 pl-0 transition-all hover:pl-2" asChild>
          <Link href="/instructor">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("instructor.backToDashboard") || "Back to Dashboard"}
          </Link>
        </Button>

        <h1 className="mb-2 text-3xl text-[#141413]" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>{course.title}</h1>
        <p className="text-[#87867f]">
          {t("instructor.manageContentDesc") || "Manage modules and lessons for this course."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-6 shadow-[0_0_0_1px_#f0eee6]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl text-[#141413]" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
                {t("courses.curriculum") || "Curriculum"}
              </h2>
            </div>

            <div className="mb-6 flex gap-2">
              <Input
                placeholder={t("instructor.newModuleName") || "New Module Name"}
                value={newModuleName}
                onChange={(event) => setNewModuleName(event.target.value)}
              />
              <Button onClick={handleCreateModule} disabled={isCreatingModule || !newModuleName.trim()}>
                {isCreatingModule ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t("instructor.addModule") || "Add"}
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {course.modules?.map((module) => (
                <AccordionItem key={module.id} value={`module-${module.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#141413]">{module.title}</span>
                      <span className="text-xs font-normal text-[#87867f]">
                        ({module.lessons?.length || 0} lessons)
                      </span>
                      {reorderingModuleId === module.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-[#c96442]" />
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {module.lessons?.map((lesson) => {
                        const isDragged =
                          dragState?.moduleId === module.id && dragState?.lessonId === lesson.id

                        return (
                          <div
                            key={lesson.id}
                            className={`group flex items-center justify-between rounded-lg p-3 ${
                              isDragged ? "bg-[#e8e6dc]" : "bg-[#f0eee6]"
                            }`}
                            draggable
                            onDragStart={() => handleLessonDragStart(module.id!, lesson.id!)}
                            onDragEnd={handleLessonDragEnd}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault()
                              void handleLessonDrop(module.id!, lesson.id!)
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Video className="h-4 w-4 text-[#87867f]" />
                              <span className="text-sm font-medium text-[#4d4c48]">{lesson.title}</span>
                              {lesson.type === "VIDEO" && lesson.videoStatus === "READY" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f1e6] px-2 py-0.5 text-[11px] text-[#1f7a3a]">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {t("instructor.videoUploader.statusReady")}
                                </span>
                              )}
                              {lesson.type === "VIDEO" && lesson.videoStatus === "FAILED" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#fdf3ef] px-2 py-0.5 text-[11px] text-[#b53333]">
                                  <AlertTriangle className="h-3 w-3" />
                                  {t("instructor.videoUploader.statusFailed")}
                                </span>
                              )}
                              {lesson.type === "VIDEO" && lesson.videoStatus === "UPLOADING" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4e0] px-2 py-0.5 text-[11px] text-[#a86a00]">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {t("instructor.videoUploader.statusUploading")}
                                </span>
                              )}
                              {lesson.type === "VIDEO" && lesson.videoStatus === "PENDING" && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0eee6] px-2 py-0.5 text-[11px] text-[#5e5d59]">
                                  <Clock className="h-3 w-3" />
                                  {t("instructor.videoUploader.statusPending")}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-[#c96442] hover:bg-[#fdf3ef] hover:text-[#c96442]"
                                    title={t("instructor.videoUploader.uploadButton")}
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      {t("instructor.videoUploader.dialogTitle")}: {lesson.title}
                                    </DialogTitle>
                                  </DialogHeader>
                                  {lesson.id != null && (
                                    <VideoUploader
                                      lessonId={lesson.id}
                                      onUploaded={() => {
                                        void fetchCourse()
                                      }}
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-[#b53333] hover:bg-[#f4e3e3] hover:text-[#b53333]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}

                      <div className="pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full border-dashed">
                              <Plus className="mr-2 h-4 w-4" />
                              {t("instructor.addLesson") || "Add Lesson"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {t("instructor.addLessonTo") || "Add Lesson to"} {module.title}
                              </DialogTitle>
                            </DialogHeader>
                            <LessonCreatorForm
                              moduleId={module.id!}
                              defaultOrderIndex={(module.lessons?.length || 0) + 1}
                              onSuccess={() => {
                                void fetchCourse()
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}

              {(!course.modules || course.modules.length === 0) && (
                <div className="py-8 text-center text-[#87867f]">
                  {t("instructor.noModules") || "No modules yet. Add one above."}
                </div>
              )}
            </Accordion>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-6">
            <h3 className="mb-2 text-[#141413]" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
              {t("instructor.courseStatus") || "Course Status"}
            </h3>
            <div
              className={`mb-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                course.active ? "bg-[#e8e6dc] text-[#4d4c48]" : "bg-[#f0eee6] text-[#87867f]"
              }`}
            >
              {course.active ? (t("common.active") || "Active") : (t("common.draft") || "Draft")}
            </div>

            <div className="space-y-3 text-sm text-[#5e5d59]">
              <div className="flex justify-between">
                <span>{t("common.price") || "Price"}</span>
                <span className="font-medium">${course.price}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.level") || "Level"}</span>
                <span className="font-medium">{course.level}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("common.duration") || "Duration"}</span>
                <span className="font-medium">{course.duration}h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
