"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ClipboardCheck, FileText, Link2, Loader2, Paperclip, PlayCircle, Upload } from "lucide-react"

import { FormField } from "@/components/admin/ui"
import MarkdownEditor from "@/components/articles/MarkdownEditor"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { uploadLessonVideoFile } from "@/lib/lessonVideoUploadService"
import { LessonInput, LessonType, StudioLesson, studioApi } from "@/lib/studio-api"
import { MEDIA_FILE_ACCEPT } from "@/lib/videoSource"
import { cn } from "@/lib/utils"

const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024
const MAX_RESOURCE_BYTES = 50 * 1024 * 1024
const RESOURCE_ACCEPT = ".pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"

export const LESSON_TYPES: { type: LessonType; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "VIDEO", icon: PlayCircle },
  { type: "TEXT", icon: FileText },
  { type: "RESOURCE", icon: Paperclip },
  { type: "QUIZ", icon: ClipboardCheck },
]

const TYPE_ICONS: Record<LessonType, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  RESOURCE: Paperclip,
  QUIZ: ClipboardCheck,
  ASSIGNMENT: FileText,
}

/** Icon for a lesson type; a component so callers never create components during render. */
export function LessonTypeIcon({ type, ...props }: { type: LessonType } & React.SVGProps<SVGSVGElement>) {
  const Icon = TYPE_ICONS[type] ?? FileText
  return <Icon {...props} />
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: number
  /** Present when editing. */
  lesson?: StudioLesson | null
  nextOrderIndex: number
  onSaved: (lesson: StudioLesson) => void
}

export function LessonDialog({ open, onOpenChange, moduleId, lesson, nextOrderIndex, onSaved }: Props) {
  const t = useTranslations("studio.lesson")
  const tc = useTranslations("admin.common")
  const { toast } = useToast()
  const [type, setType] = React.useState<LessonType>(lesson?.type ?? "VIDEO")
  const [title, setTitle] = React.useState(lesson?.title ?? "")
  const [description, setDescription] = React.useState(lesson?.description ?? "")
  const [content, setContent] = React.useState(lesson?.content ?? "")
  const [videoUrl, setVideoUrl] = React.useState(lesson?.videoUrl ?? "")
  const [videoFile, setVideoFile] = React.useState<File | null>(null)
  const [resourceUrl, setResourceUrl] = React.useState(lesson?.resourceUrl ?? "")
  const [duration, setDuration] = React.useState(lesson?.duration != null ? String(lesson.duration) : "")
  const [isFree, setIsFree] = React.useState(Boolean(lesson?.isFree))
  const [visible, setVisible] = React.useState(lesson?.active !== false)
  const [saving, setSaving] = React.useState(false)
  const [uploadingResource, setUploadingResource] = React.useState(false)
  const [progress, setProgress] = React.useState<number | null>(null)
  const resourceInput = React.useRef<HTMLInputElement>(null)

  const hasUploadedVideo = Boolean(lesson?.videoObjectKey)

  const pickResource = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (file.size > MAX_RESOURCE_BYTES) {
      toast({ variant: "destructive", title: t("resourceTooLarge") })
      return
    }
    setUploadingResource(true)
    try {
      const uploaded = await studioApi.uploadResource(file)
      setResourceUrl(uploaded.url)
      if (!title.trim()) setTitle(file.name.replace(/\.[^.]+$/, ""))
    } catch (err) {
      toast({ variant: "destructive", title: t("uploadFailed"), description: getErrorMessage(err) })
    } finally {
      setUploadingResource(false)
    }
  }

  const pickVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (file && file.size > MAX_VIDEO_BYTES) {
      toast({ variant: "destructive", title: t("videoTooLarge") })
      event.target.value = ""
      return
    }
    setVideoFile(file)
    if (file) setVideoUrl("")
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      toast({ variant: "destructive", title: t("titleRequired") })
      return
    }
    if (type === "RESOURCE" && !isHttpUrl(resourceUrl)) {
      toast({ variant: "destructive", title: t("resourceRequired") })
      return
    }
    if (type === "VIDEO" && videoUrl.trim() && !isHttpUrl(videoUrl)) {
      toast({ variant: "destructive", title: t("invalidLink") })
      return
    }
    const minutes = duration.trim() ? Number(duration) : undefined
    if (minutes !== undefined && (!Number.isFinite(minutes) || minutes < 0)) {
      toast({ variant: "destructive", title: t("invalidDuration") })
      return
    }

    const input: LessonInput = {
      moduleId: lesson?.moduleId ?? moduleId,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      videoUrl: type === "VIDEO" ? videoUrl.trim() || undefined : undefined,
      content: type === "TEXT" || type === "QUIZ" ? content || undefined : undefined,
      resourceUrl: type === "RESOURCE" ? resourceUrl.trim() : undefined,
      duration: minutes !== undefined ? Math.round(minutes) : undefined,
      orderIndex: lesson?.orderIndex ?? nextOrderIndex,
      isFree,
      active: visible,
    }

    setSaving(true)
    try {
      let saved = lesson ? await studioApi.updateLesson(lesson.id, input) : await studioApi.createLesson(input)
      if (type === "VIDEO" && videoFile) {
        setProgress(0)
        saved = (await uploadLessonVideoFile(saved.id, videoFile, setProgress)) as unknown as StudioLesson
      }
      toast({ title: lesson ? t("updated") : t("created") })
      onSaved(saved)
      onOpenChange(false)
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lesson ? t("editTitle") : t("addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink">{t("type")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LESSON_TYPES.map(({ type: option, icon: Icon }) => (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40",
                    type === option
                      ? "border-brand bg-brand-soft text-ink"
                      : "border-line-strong bg-paper text-ink-2 hover:border-brand/50",
                  )}
                >
                  <input
                    type="radio"
                    name="lesson-type"
                    value={option}
                    checked={type === option}
                    onChange={() => setType(option)}
                    className="sr-only"
                  />
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{t(`types.${option}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField label={t("title")} htmlFor="lesson-title">
            <Input id="lesson-title" value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label={t("summary")} htmlFor="lesson-summary" hint={t("summaryHint")}>
            <Textarea
              id="lesson-summary"
              rows={2}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>

          {type === "VIDEO" ? (
            <div className="space-y-3 rounded-lg border border-line-strong bg-paper p-3">
              {hasUploadedVideo && !videoFile ? (
                <p className="text-sm text-ink-2">{t("videoAlreadyUploaded")}</p>
              ) : null}
              <FormField label={t("videoFile")} htmlFor="lesson-video" hint={t("videoFileHint")}>
                <Input id="lesson-video" type="file" accept={MEDIA_FILE_ACCEPT} onChange={pickVideo} />
              </FormField>
              <FormField label={t("videoLink")} htmlFor="lesson-video-url" hint={t("videoLinkHint")}>
                <Input
                  id="lesson-video-url"
                  type="url"
                  dir="ltr"
                  placeholder="https://"
                  value={videoUrl}
                  disabled={Boolean(videoFile)}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </FormField>
              {progress !== null ? (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-ink-3">
                    <span>{t("uploading")}</span>
                    <span dir="ltr">{progress}%</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-sand"
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {type === "TEXT" ? (
            <FormField label={t("article")} hint={t("articleHint")}>
              <MarkdownEditor value={content} onChange={setContent} />
            </FormField>
          ) : null}

          {type === "RESOURCE" ? (
            <div className="space-y-3 rounded-lg border border-line-strong bg-paper p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => resourceInput.current?.click()} disabled={uploadingResource}>
                  {uploadingResource ? <Loader2 className="animate-spin" /> : <Upload />}
                  {t("uploadResource")}
                </Button>
                <span className="text-xs text-ink-3">{t("resourceHint")}</span>
                <input ref={resourceInput} type="file" accept={RESOURCE_ACCEPT} className="hidden" onChange={(e) => void pickResource(e)} />
              </div>
              <FormField label={t("resourceLink")} htmlFor="lesson-resource">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  <Input
                    id="lesson-resource"
                    type="url"
                    dir="ltr"
                    className="ps-9"
                    placeholder="https://"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
                </div>
              </FormField>
            </div>
          ) : null}

          {type === "QUIZ" ? (
            <div className="space-y-3">
              <p className="rounded-lg border border-line-strong bg-paper px-3 py-2.5 text-sm text-ink-2">
                {lesson?.quizId ? t("quizExists") : t("quizNext")}
              </p>
              <FormField label={t("quizInstructions")} htmlFor="lesson-quiz-notes">
                <Textarea id="lesson-quiz-notes" rows={3} value={content} onChange={(e) => setContent(e.target.value)} />
              </FormField>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label={t("duration")} htmlFor="lesson-duration">
              <Input
                id="lesson-duration"
                type="number"
                min="0"
                dir="ltr"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormField>
            <label className="flex items-start gap-2 pt-7 text-sm text-ink">
              <Checkbox checked={isFree} onCheckedChange={(c) => setIsFree(c === true)} />
              <span>
                {t("freePreview")}
                <span className="block text-xs text-ink-3">{t("freePreviewHint")}</span>
              </span>
            </label>
            <label className="flex items-start gap-2 pt-7 text-sm text-ink">
              <Checkbox checked={visible} onCheckedChange={(c) => setVisible(c === true)} />
              <span>
                {t("visible")}
                <span className="block text-xs text-ink-3">{t("visibleHint")}</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={saving || uploadingResource}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {lesson ? t("save") : type === "QUIZ" ? t("createAndBuild") : t("create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
