"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Plus, Trash2, Video } from "lucide-react"
import { useTranslations } from "next-intl"

import { useAuth } from "@/components/auth-context"
import { LessonResponse, CourseResponse, CoursesService, ModulesService } from "@/lib/api"
import { reorderModuleLessons } from "@/lib/lessonVideoUploadService"
import { Button } from "@/components/ui/button"
import { LessonCreatorForm } from "@/components/instructor/LessonCreatorForm"
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
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
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

        <h1 className="mb-2 text-3xl font-bold text-slate-900">{course.title}</h1>
        <p className="text-slate-500">
          {t("instructor.manageContentDesc") || "Manage modules and lessons for this course."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
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
                      <span className="font-medium text-slate-900">{module.title}</span>
                      <span className="text-xs font-normal text-slate-500">
                        ({module.lessons?.length || 0} lessons)
                      </span>
                      {reorderingModuleId === module.id && (
                        <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
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
                              isDragged ? "bg-sky-100" : "bg-slate-50"
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
                              <Video className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
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
                <div className="py-8 text-center text-slate-500">
                  {t("instructor.noModules") || "No modules yet. Add one above."}
                </div>
              )}
            </Accordion>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-2 font-semibold text-slate-900">
              {t("instructor.courseStatus") || "Course Status"}
            </h3>
            <div
              className={`mb-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                course.active ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {course.active ? (t("common.active") || "Active") : (t("common.draft") || "Draft")}
            </div>

            <div className="space-y-3 text-sm text-slate-600">
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
