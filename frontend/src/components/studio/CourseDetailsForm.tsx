"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { FormField, Panel, Select } from "@/components/admin/ui"
import { useSiteCurrency } from "@/components/studio/StudioShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { uploadCourseThumbnail, validateThumbnailFile } from "@/lib/courseThumbnail"
import { LandingSpecialization, specializationsApi } from "@/lib/landingPage"
import { CourseInput, StudioCourse, studioApi } from "@/lib/studio-api"

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const
const MAX_ITEMS = 20

interface FormState {
  title: string
  description: string
  instructor: string
  price: string
  duration: string
  level: string
  category: string
  thumbnailUrl: string
  previewVideoUrl: string
  learningOutcomes: string[]
  requirements: string[]
  tags: string
}

function toState(course?: StudioCourse | null): FormState {
  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    instructor: course?.instructor ?? "",
    price: course ? String(course.price) : "0",
    duration: course ? String(course.duration) : "1",
    level: course?.level ?? "BEGINNER",
    category: course?.category ?? "GENERAL",
    thumbnailUrl: course?.thumbnailUrl ?? "",
    previewVideoUrl: course?.previewVideoUrl ?? "",
    learningOutcomes: course?.learningOutcomes?.length ? course.learningOutcomes : [""],
    requirements: course?.requirements?.length ? course.requirements : [""],
    tags: (course?.tags ?? []).join(", "),
  }
}

function ListEditor({
  id,
  items,
  onChange,
  placeholder,
  addLabel,
  removeLabel,
}: {
  id: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
  removeLabel: string
}) {
  return (
    <div className="space-y-2" id={id}>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            maxLength={500}
            placeholder={placeholder}
            aria-label={`${placeholder} ${index + 1}`}
            onChange={(e) => onChange(items.map((v, i) => (i === index ? e.target.value : v)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={removeLabel}
            onClick={() => onChange(items.length === 1 ? [""] : items.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4 text-ink-3" />
          </Button>
        </div>
      ))}
      {items.length < MAX_ITEMS ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
          <Plus /> {addLabel}
        </Button>
      ) : null}
    </div>
  )
}

/** Create a course (no `course`) or edit an existing one. */
export function CourseDetailsForm({
  course,
  onSaved,
}: {
  course?: StudioCourse | null
  onSaved: (course: StudioCourse) => void
}) {
  const t = useTranslations("studio.details")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { user } = useAuth()
  const { toast } = useToast()
  const currency = useSiteCurrency()
  const fileInput = React.useRef<HTMLInputElement>(null)
  const [form, setForm] = React.useState<FormState>(() => toState(course))
  const [categories, setCategories] = React.useState<LandingSpecialization[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const isAdmin = user?.role === "ADMIN"

  React.useEffect(() => {
    specializationsApi
      .getPublic()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  const pickThumbnail = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const check = validateThumbnailFile(file)
    if (!check.ok) {
      toast({ variant: "destructive", title: check.reason === "size" ? t("thumbnailTooLarge") : t("thumbnailType") })
      return
    }
    setUploading(true)
    try {
      const uploaded = await uploadCourseThumbnail(file)
      set("thumbnailUrl", uploaded.url)
    } catch (err) {
      toast({ variant: "destructive", title: t("thumbnailFailed"), description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const price = Number(form.price)
    const duration = Number(form.duration)
    if (!form.title.trim() || form.title.trim().length < 3) {
      toast({ variant: "destructive", title: t("titleTooShort") })
      return
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(duration) || duration < 1) {
      toast({ variant: "destructive", title: t("invalidNumbers") })
      return
    }
    const input: CourseInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      instructor: isAdmin ? form.instructor.trim() || undefined : undefined,
      price,
      duration: Math.round(duration),
      level: form.level,
      category: form.category || "GENERAL",
      thumbnailUrl: form.thumbnailUrl || null,
      previewVideoUrl: form.previewVideoUrl.trim() || null,
      learningOutcomes: form.learningOutcomes.map((v) => v.trim()).filter(Boolean),
      requirements: form.requirements.map((v) => v.trim()).filter(Boolean),
      tags: form.tags
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    }
    setSaving(true)
    try {
      const saved = course ? await studioApi.updateCourse(course.id, input) : await studioApi.createCourse(input)
      toast({ title: course ? t("saved") : t("created") })
      onSaved(saved)
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const categoryName = (c: LandingSpecialization) => (locale === "ar" ? c.nameAr : c.nameEn) || c.nameEn || c.slug

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-6">
      <Panel title={t("basics")}>
        <div className="grid gap-6 p-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            <span className="text-sm font-medium text-ink">{t("thumbnail")}</span>
            {form.thumbnailUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-line-strong bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute end-2 top-2"
                  onClick={() => set("thumbnailUrl", "")}
                >
                  <X /> {t("remove")}
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-paper text-sm text-ink-3 transition-colors hover:border-brand hover:text-brand"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                <span>{t("chooseImage")}</span>
                <span className="text-xs">{t("thumbnailHint")}</span>
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void pickThumbnail(e)}
            />
          </div>

          <div className="space-y-4">
            <FormField label={t("title")} htmlFor="course-title">
              <Input
                id="course-title"
                value={form.title}
                maxLength={200}
                required
                onChange={(e) => set("title", e.target.value)}
              />
            </FormField>
            <FormField
              label={t("description")}
              htmlFor="course-description"
              hint={t("charsLeft", { count: 5000 - form.description.length })}
            >
              <Textarea
                id="course-description"
                rows={6}
                maxLength={5000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </FormField>
            {isAdmin ? (
              <FormField label={t("instructorName")} htmlFor="course-instructor" hint={t("instructorHint")}>
                <Input
                  id="course-instructor"
                  value={form.instructor}
                  maxLength={100}
                  onChange={(e) => set("instructor", e.target.value)}
                />
              </FormField>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel title={t("pricing")}>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t("category")} htmlFor="course-category">
            <Select
              id="course-category"
              className="w-full"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="GENERAL">{t("general")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {categoryName(c)}
                </option>
              ))}
              {form.category !== "GENERAL" && !categories.some((c) => c.slug === form.category) ? (
                <option value={form.category}>{form.category}</option>
              ) : null}
            </Select>
          </FormField>
          <FormField label={t("level")} htmlFor="course-level">
            <Select id="course-level" className="w-full" value={form.level} onChange={(e) => set("level", e.target.value)}>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(`levels.${level}`)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("price", { currency })} htmlFor="course-price" hint={t("priceHint")}>
            <Input
              id="course-price"
              type="number"
              min="0"
              step="0.01"
              dir="ltr"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </FormField>
          <FormField label={t("duration")} htmlFor="course-duration">
            <Input
              id="course-duration"
              type="number"
              min="1"
              dir="ltr"
              value={form.duration}
              onChange={(e) => set("duration", e.target.value)}
            />
          </FormField>
        </div>
      </Panel>

      <Panel title={t("landing")}>
        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <FormField label={t("outcomes")} htmlFor="course-outcomes" hint={t("outcomesHint")}>
            <ListEditor
              id="course-outcomes"
              items={form.learningOutcomes}
              onChange={(items) => set("learningOutcomes", items)}
              placeholder={t("outcomePlaceholder")}
              addLabel={t("addItem")}
              removeLabel={t("removeItem")}
            />
          </FormField>
          <FormField label={t("requirements")} htmlFor="course-requirements" hint={t("requirementsHint")}>
            <ListEditor
              id="course-requirements"
              items={form.requirements}
              onChange={(items) => set("requirements", items)}
              placeholder={t("requirementPlaceholder")}
              addLabel={t("addItem")}
              removeLabel={t("removeItem")}
            />
          </FormField>
          <FormField label={t("previewVideo")} htmlFor="course-preview" hint={t("previewVideoHint")}>
            <Input
              id="course-preview"
              type="url"
              dir="ltr"
              placeholder="https://"
              value={form.previewVideoUrl}
              onChange={(e) => set("previewVideoUrl", e.target.value)}
            />
          </FormField>
          <FormField label={t("tags")} htmlFor="course-tags" hint={t("tagsHint")}>
            <Input id="course-tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </FormField>
        </div>
      </Panel>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {course ? t("save") : t("createDraft")}
        </Button>
      </div>
    </form>
  )
}
