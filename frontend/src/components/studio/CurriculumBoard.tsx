"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Clock,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { Badge, ConfirmDialog } from "@/components/admin/ui"
import { VideoUploader } from "@/components/instructor/VideoUploader"
import { LessonDialog, LessonTypeIcon } from "@/components/studio/LessonDialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { StudioCourse, StudioLesson, StudioModule, studioApi } from "@/lib/studio-api"
import { cn } from "@/lib/utils"

const moduleKey = (id: number) => `module-${id}`
const lessonKey = (id: number) => `lesson-${id}`
const dropKey = (id: number) => `drop-${id}`

type Layout = { id: number; lessonIds: number[] }[]

function layoutOf(modules: StudioModule[]): Layout {
  return modules.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) }))
}

function sameLayout(a: Layout, b: Layout) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function LessonRow({
  lesson,
  courseId,
  onEdit,
  onUpload,
  onDelete,
}: {
  lesson: StudioLesson
  courseId: number
  onEdit: () => void
  onUpload: () => void
  onDelete: () => void
}) {
  const t = useTranslations("studio.curriculum")
  const tl = useTranslations("studio.lesson")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: lessonKey(lesson.id),
    data: { type: "lesson" },
  })
  const isVideo = lesson.type === "VIDEO"
  const isQuiz = lesson.type === "QUIZ"

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-line-strong bg-paper p-2.5 sm:flex-row sm:items-center",
        isDragging && "relative z-10 opacity-80 shadow-lg ring-2 ring-brand/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("dragLesson", { title: lesson.title })}
          className="cursor-grab touch-none rounded p-1 text-ink-3 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <LessonTypeIcon type={lesson.type} className="h-4 w-4 shrink-0 text-brand" aria-label={tl(`types.${lesson.type}`)} />
        <span className="truncate text-sm font-medium text-ink">{lesson.title}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {lesson.isFree ? <Badge tone="accent">{t("free")}</Badge> : null}
          {lesson.active === false ? (
            <Badge tone="gray">
              <EyeOff className="me-1 h-3 w-3" /> {t("hidden")}
            </Badge>
          ) : null}
          {isVideo && lesson.videoStatus === "READY" ? <Badge tone="green">{t("videoReady")}</Badge> : null}
          {isVideo && lesson.videoStatus === "UPLOADING" ? <Badge tone="amber">{t("videoUploading")}</Badge> : null}
          {isVideo && lesson.videoStatus === "FAILED" ? (
            <Badge tone="red">
              <AlertTriangle className="me-1 h-3 w-3" /> {t("videoFailed")}
            </Badge>
          ) : null}
          {isVideo && (!lesson.videoStatus || lesson.videoStatus === "PENDING") ? (
            <Badge tone="amber">
              <Clock className="me-1 h-3 w-3" /> {t("videoMissing")}
            </Badge>
          ) : null}
          {isQuiz && !lesson.quizId ? <Badge tone="amber">{t("quizMissing")}</Badge> : null}
          {lesson.duration ? (
            <span className="text-xs text-ink-3" dir="ltr">
              {t("minutes", { count: lesson.duration })}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 ps-8 sm:ps-0">
        {isVideo ? (
          <Button type="button" size="sm" variant="ghost" onClick={onUpload}>
            <Upload /> <span className="sm:sr-only lg:not-sr-only">{t("uploadVideo")}</span>
          </Button>
        ) : null}
        {isQuiz ? (
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/instructor/courses/${courseId}/lessons/${lesson.id}/quiz`}>
              <ClipboardCheck /> <span className="sm:sr-only lg:not-sr-only">{lesson.quizId ? t("editQuiz") : t("buildQuiz")}</span>
            </Link>
          </Button>
        ) : null}
        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} aria-label={t("editLesson")}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-danger hover:bg-danger-soft hover:text-danger"
          onClick={onDelete}
          aria-label={t("deleteLesson")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}

function ModuleCard({
  module,
  index,
  children,
  onAddLesson,
  onRename,
  onDelete,
}: {
  module: StudioModule
  index: number
  children: React.ReactNode
  onAddLesson: () => void
  onRename: (title: string) => Promise<void>
  onDelete: () => void
}) {
  const t = useTranslations("studio.curriculum")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: moduleKey(module.id),
    data: { type: "module" },
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: dropKey(module.id), data: { type: "drop", moduleId: module.id } })
  const [editing, setEditing] = React.useState(false)
  const [title, setTitle] = React.useState(module.title)
  const [saving, setSaving] = React.useState(false)

  const save = async () => {
    if (!title.trim() || title.trim() === module.title) {
      setEditing(false)
      setTitle(module.title)
      return
    }
    setSaving(true)
    try {
      await onRename(title.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "rounded-xl border border-line bg-surface",
        isDragging && "relative z-20 opacity-90 shadow-xl ring-2 ring-brand/40",
      )}
      aria-label={module.title}
    >
      <header className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={t("dragModule", { title: module.title })}
          className="cursor-grab touch-none rounded p-1 text-ink-3 hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-3">{t("section", { number: index + 1 })}</span>
        {editing ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <Input
              autoFocus
              value={title}
              maxLength={255}
              aria-label={t("sectionTitle")}
              className="h-8"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setEditing(false)
                  setTitle(module.title)
                }
              }}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-8 w-8" disabled={saving} aria-label={t("saveTitle")}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              aria-label={t("cancelRename")}
              onClick={() => {
                setEditing(false)
                setTitle(module.title)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <h3 className="min-w-0 flex-1 truncate font-semibold text-ink">{module.title}</h3>
            <span className="text-xs text-ink-3">{t("lessonCount", { count: module.lessons.length })}</span>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)} aria-label={t("renameSection")}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-danger hover:bg-danger-soft hover:text-danger"
              onClick={onDelete}
              aria-label={t("deleteSection")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </header>
      <div
        ref={setDropRef}
        className={cn("space-y-2 p-3 transition-colors", isOver && module.lessons.length === 0 && "bg-brand-soft")}
      >
        {module.lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-center text-sm text-ink-3">
            {t("emptySection")}
          </p>
        ) : null}
        {children}
        <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={onAddLesson}>
          <Plus /> {t("addLesson")}
        </Button>
      </div>
    </section>
  )
}

export function CurriculumBoard({
  course,
  onCourseChange,
  reload,
}: {
  course: StudioCourse
  onCourseChange: (modules: StudioModule[]) => void
  reload: () => Promise<void>
}) {
  const t = useTranslations("studio.curriculum")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const router = useRouter()
  const [modules, setModules] = React.useState<StudioModule[]>(course.modules)
  const [activeType, setActiveType] = React.useState<"module" | "lesson" | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [newSection, setNewSection] = React.useState("")
  const [addingSection, setAddingSection] = React.useState(false)
  const [lessonDialog, setLessonDialog] = React.useState<{ moduleId: number; lesson?: StudioLesson } | null>(null)
  const [uploadFor, setUploadFor] = React.useState<StudioLesson | null>(null)
  const [deleteLesson, setDeleteLesson] = React.useState<StudioLesson | null>(null)
  const [deleteModule, setDeleteModule] = React.useState<StudioModule | null>(null)
  const [busy, setBusy] = React.useState(false)
  const dragStartLayout = React.useRef<Layout | null>(null)

  // Follow server data whenever we are not in the middle of a drag.
  React.useEffect(() => {
    if (!activeType) setModules(course.modules)
  }, [course.modules, activeType])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const findModuleOf = (key: string, list: StudioModule[]): number | null => {
    if (key.startsWith("module-")) return Number(key.slice(7))
    if (key.startsWith("drop-")) return Number(key.slice(5))
    if (key.startsWith("lesson-")) {
      const id = Number(key.slice(7))
      return list.find((m) => m.lessons.some((l) => l.id === id))?.id ?? null
    }
    return null
  }

  const persist = async (next: StudioModule[]) => {
    const layout = layoutOf(next)
    if (dragStartLayout.current && sameLayout(layout, dragStartLayout.current)) return
    // Optimistic: show the new order right away, roll back by reloading if the save fails.
    onCourseChange(
      next.map((m, i) => ({
        ...m,
        orderIndex: i + 1,
        lessons: m.lessons.map((l, j) => ({ ...l, moduleId: m.id, orderIndex: j + 1 })),
      })),
    )
    setSaving(true)
    try {
      await studioApi.saveCurriculum(course.id, {
        modules: layout.map((m) => ({ moduleId: m.id, lessonIds: m.lessonIds })),
      })
    } catch (err) {
      toast({ variant: "destructive", title: t("orderFailed"), description: getErrorMessage(err) })
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const onDragStart = (event: DragStartEvent) => {
    dragStartLayout.current = layoutOf(modules)
    setActiveType(event.active.data.current?.type === "module" ? "module" : "lesson")
  }

  // Moving a lesson into another section happens live while dragging.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.data.current?.type !== "lesson") return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    setModules((current) => {
      const from = findModuleOf(activeKey, current)
      const to = findModuleOf(overKey, current)
      if (from == null || to == null || from === to) return current
      const lessonId = Number(activeKey.slice(7))
      const source = current.find((m) => m.id === from)!
      const lesson = source.lessons.find((l) => l.id === lessonId)!
      return current.map((m) => {
        if (m.id === from) return { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
        if (m.id === to) {
          const overIndex = overKey.startsWith("lesson-") ? m.lessons.findIndex((l) => l.id === Number(overKey.slice(7))) : -1
          const lessons = [...m.lessons]
          lessons.splice(overIndex >= 0 ? overIndex : lessons.length, 0, { ...lesson, moduleId: to })
          return { ...m, lessons }
        }
        return m
      })
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const type = active.data.current?.type
    setActiveType(null)
    if (!over) {
      setModules(course.modules)
      return
    }
    let next = modules
    if (type === "module") {
      const from = modules.findIndex((m) => moduleKey(m.id) === active.id)
      const targetModule = findModuleOf(String(over.id), modules)
      const to = modules.findIndex((m) => m.id === targetModule)
      if (from >= 0 && to >= 0 && from !== to) next = arrayMove(modules, from, to)
    } else {
      const moduleId = findModuleOf(String(active.id), modules)
      const section = modules.find((m) => m.id === moduleId)
      if (section && String(over.id).startsWith("lesson-")) {
        const from = section.lessons.findIndex((l) => lessonKey(l.id) === active.id)
        const to = section.lessons.findIndex((l) => lessonKey(l.id) === over.id)
        if (from >= 0 && to >= 0 && from !== to) {
          next = modules.map((m) => (m.id === section.id ? { ...m, lessons: arrayMove(m.lessons, from, to) } : m))
        }
      }
    }
    setModules(next)
    void persist(next)
  }

  const announcements: Announcements = {
    onDragStart: () => t("a11y.picked"),
    onDragOver: ({ over }) => (over ? t("a11y.over") : t("a11y.outside")),
    onDragEnd: ({ over }) => (over ? t("a11y.dropped") : t("a11y.cancelled")),
    onDragCancel: () => t("a11y.cancelled"),
  }

  const addSection = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newSection.trim()) return
    setAddingSection(true)
    try {
      const created = await studioApi.createModule(course.id, newSection.trim(), modules.length + 1)
      onCourseChange([...modules, { ...created, lessons: [] }])
      setNewSection("")
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setAddingSection(false)
    }
  }

  const renameModule = async (module: StudioModule, title: string) => {
    try {
      await studioApi.updateModule(module, title)
      onCourseChange(modules.map((m) => (m.id === module.id ? { ...m, title } : m)))
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
      throw err
    }
  }

  const confirmDeleteLesson = async () => {
    if (!deleteLesson) return
    setBusy(true)
    try {
      await studioApi.deleteLesson(deleteLesson.id)
      onCourseChange(modules.map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.id !== deleteLesson.id) })))
      setDeleteLesson(null)
      toast({ title: t("lessonDeleted") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const confirmDeleteModule = async () => {
    if (!deleteModule) return
    setBusy(true)
    try {
      await studioApi.deleteModule(deleteModule.id)
      onCourseChange(modules.filter((m) => m.id !== deleteModule.id))
      setDeleteModule(null)
      toast({ title: t("sectionDeleted") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const lessonSaved = (saved: StudioLesson, isNew: boolean) => {
    onCourseChange(
      modules.map((m) => {
        if (m.id !== saved.moduleId) return m
        const lessons = isNew ? [...m.lessons, saved] : m.lessons.map((l) => (l.id === saved.id ? saved : l))
        return { ...m, lessons }
      }),
    )
    if (isNew && saved.type === "QUIZ") {
      router.push(`/instructor/courses/${course.id}/lessons/${saved.id}/quiz`)
    }
  }

  const dialogModule = lessonDialog ? modules.find((m) => m.id === lessonDialog.moduleId) : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-2">{t("hint")}</p>
        {saving ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-3" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("savingOrder")}
          </span>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => {
          setActiveType(null)
          setModules(course.modules)
        }}
        accessibility={{ announcements }}
      >
        <SortableContext items={modules.map((m) => moduleKey(m.id))} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {modules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onAddLesson={() => setLessonDialog({ moduleId: module.id })}
                onRename={(title) => renameModule(module, title)}
                onDelete={() => setDeleteModule(module)}
              >
                <SortableContext items={module.lessons.map((l) => lessonKey(l.id))} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        courseId={course.id}
                        onEdit={() => setLessonDialog({ moduleId: module.id, lesson })}
                        onUpload={() => setUploadFor(lesson)}
                        onDelete={() => setDeleteLesson(lesson)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </ModuleCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-line-strong px-6 py-10 text-center">
          <p className="font-medium text-ink">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-ink-3">{t("emptyDescription")}</p>
        </div>
      ) : null}

      <form onSubmit={(e) => void addSection(e)} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newSection}
          maxLength={255}
          placeholder={t("newSectionPlaceholder")}
          aria-label={t("newSectionPlaceholder")}
          onChange={(e) => setNewSection(e.target.value)}
        />
        <Button type="submit" disabled={addingSection || !newSection.trim()}>
          {addingSection ? <Loader2 className="animate-spin" /> : <Plus />} {t("addSection")}
        </Button>
      </form>

      {lessonDialog ? (
        <LessonDialog
          key={lessonDialog.lesson?.id ?? `new-${lessonDialog.moduleId}`}
          open
          onOpenChange={(open) => !open && setLessonDialog(null)}
          moduleId={lessonDialog.moduleId}
          lesson={lessonDialog.lesson}
          nextOrderIndex={(dialogModule?.lessons.length ?? 0) + 1}
          onSaved={(saved) => lessonSaved(saved, !lessonDialog.lesson)}
        />
      ) : null}

      <Dialog open={!!uploadFor} onOpenChange={(open) => !open && setUploadFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("uploadTitle", { title: uploadFor?.title ?? "" })}</DialogTitle>
          </DialogHeader>
          {uploadFor ? (
            <VideoUploader
              lessonId={uploadFor.id}
              onUploaded={() => {
                void reload()
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteLesson}
        onOpenChange={(open) => !open && setDeleteLesson(null)}
        title={t("deleteLessonTitle")}
        description={t("deleteLessonDescription", { title: deleteLesson?.title ?? "" })}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        destructive
        busy={busy}
        onConfirm={() => void confirmDeleteLesson()}
      />
      <ConfirmDialog
        open={!!deleteModule}
        onOpenChange={(open) => !open && setDeleteModule(null)}
        title={t("deleteSectionTitle")}
        description={t("deleteSectionDescription", {
          title: deleteModule?.title ?? "",
          count: deleteModule?.lessons.length ?? 0,
        })}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        destructive
        busy={busy}
        onConfirm={() => void confirmDeleteModule()}
      />
    </div>
  )
}
