"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import {
  landingPageApi,
  specializationsApi,
  type LandingPageData,
  type LandingPageUpdateRequest,
  type LandingSpecialization,
  type SpecializationRequest,
} from "@/lib/landingPage"
import { instructorsApi, type InstructorUser } from "@/lib/instructors"
import { CoursesService, type CourseResponse } from "@/lib/api"
import { articlesApi, type ArticleSummary } from "@/lib/articles"
import { TEACHERS_SECTION_DEFAULTS } from "@/lib/landingDefaults"

const emptySpecForm: SpecializationRequest = {
  nameAr: "",
  nameEn: "",
  slug: "",
  icon: "",
  displayOrder: 0,
  active: true,
}

export function LandingPageAdmin() {
  const { toast } = useToast()
  const t = useTranslations("admin.landingEditor")

  const [, setData] = useState<LandingPageData | null>(null)
  const [specializations, setSpecializations] = useState<LandingSpecialization[]>([])
  const [allCourses, setAllCourses] = useState<CourseResponse[]>([])
  const [allInstructors, setAllInstructors] = useState<InstructorUser[]>([])
  const [allArticles, setAllArticles] = useState<ArticleSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [heroVideoUrl, setHeroVideoUrl] = useState("")
  const [heroTitleAr, setHeroTitleAr] = useState("")
  const [heroTitleEn, setHeroTitleEn] = useState("")
  const [heroTeacherAr, setHeroTeacherAr] = useState("")
  const [heroTeacherEn, setHeroTeacherEn] = useState("")
  const [heroDurationAr, setHeroDurationAr] = useState("")
  const [heroDurationEn, setHeroDurationEn] = useState("")
  const [teachersTitleAr, setTeachersTitleAr] = useState("")
  const [teachersTitleEn, setTeachersTitleEn] = useState("")
  const [teachersSubtitleAr, setTeachersSubtitleAr] = useState("")
  const [teachersSubtitleEn, setTeachersSubtitleEn] = useState("")
  const [featuredCourseIds, setFeaturedCourseIds] = useState<number[]>([])
  const [featuredInstructorIds, setFeaturedInstructorIds] = useState<number[]>([])
  const [featuredArticleIds, setFeaturedArticleIds] = useState<number[]>([])

  const [specForm, setSpecForm] = useState<SpecializationRequest>(emptySpecForm)
  const [editingSpecId, setEditingSpecId] = useState<number | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [landing, specs, courses, instructors, articles] = await Promise.all([
        landingPageApi.getPublic(),
        specializationsApi.getAll(),
        CoursesService.getAllCourses({ page: 0, size: 200 }),
        instructorsApi.getAll(),
        articlesApi.list(0, 200),
      ])
      setData(landing)
      setSpecializations(specs)
      setAllCourses(courses.content ?? [])
      setAllInstructors(instructors)
      setAllArticles(articles.content ?? [])

      setHeroVideoUrl(landing.hero.videoUrl ?? "")
      setHeroTitleAr(landing.hero.titleAr ?? "")
      setHeroTitleEn(landing.hero.titleEn ?? "")
      setHeroTeacherAr(landing.hero.teacherNameAr ?? "")
      setHeroTeacherEn(landing.hero.teacherNameEn ?? "")
      setHeroDurationAr(landing.hero.durationLabelAr ?? "")
      setHeroDurationEn(landing.hero.durationLabelEn ?? "")
      setTeachersTitleAr(landing.teachersSection?.titleAr ?? "")
      setTeachersTitleEn(landing.teachersSection?.titleEn ?? "")
      setTeachersSubtitleAr(landing.teachersSection?.subtitleAr ?? "")
      setTeachersSubtitleEn(landing.teachersSection?.subtitleEn ?? "")
      setFeaturedCourseIds(landing.featuredCourses.map((c) => c.id))
      setFeaturedInstructorIds(landing.featuredInstructors.map((t) => t.id))
      setFeaturedArticleIds((landing.featuredArticles ?? []).map((a) => a.id))
    } catch (error) {
      toast({
        title: t("toasts.loadFailed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const handleHeroUpload = async (file: File) => {
    setUploading(true)
    try {
      const result = await landingPageApi.uploadHeroVideo(file)
      setHeroVideoUrl(result.url)
      toast({ title: t("toasts.videoUploaded") })
    } catch (error) {
      toast({
        title: t("toasts.uploadFailed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const saveLandingPage = async () => {
    setSaving(true)
    try {
      const payload: LandingPageUpdateRequest = {
        heroVideoUrl: heroVideoUrl.trim() || null,
        heroVideoTitleAr: heroTitleAr.trim() || null,
        heroVideoTitleEn: heroTitleEn.trim() || null,
        heroTeacherNameAr: heroTeacherAr.trim() || null,
        heroTeacherNameEn: heroTeacherEn.trim() || null,
        heroDurationLabelAr: heroDurationAr.trim() || null,
        heroDurationLabelEn: heroDurationEn.trim() || null,
        teachersTitleAr: teachersTitleAr.trim() || null,
        teachersTitleEn: teachersTitleEn.trim() || null,
        teachersSubtitleAr: teachersSubtitleAr.trim() || null,
        teachersSubtitleEn: teachersSubtitleEn.trim() || null,
        featuredCourseIds,
        featuredInstructorIds,
        featuredArticleIds,
      }
      const updated = await landingPageApi.update(payload)
      setData(updated)
      toast({ title: t("toasts.saved") })
    } catch (error) {
      toast({
        title: t("toasts.saveFailed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const submitSpec = async () => {
    if (!specForm.nameAr.trim() || !specForm.nameEn.trim() || !specForm.slug.trim()) {
      toast({ title: t("toasts.specRequired"), variant: "destructive" })
      return
    }
    try {
      if (editingSpecId == null) {
        await specializationsApi.create(specForm)
      } else {
        await specializationsApi.update(editingSpecId, specForm)
      }
      setSpecForm(emptySpecForm)
      setEditingSpecId(null)
      const refreshed = await specializationsApi.getAll()
      setSpecializations(refreshed)
      toast({ title: editingSpecId == null ? t("toasts.specCreated") : t("toasts.specUpdated") })
    } catch (error) {
      toast({
        title: t("toasts.specSaveFailed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const deleteSpec = async (id: number) => {
    if (!confirm(t("specs.confirmDelete"))) return
    try {
      await specializationsApi.delete(id)
      setSpecializations((prev) => prev.filter((s) => s.id !== id))
      toast({ title: t("toasts.specDeleted") })
    } catch (error) {
      toast({
        title: t("toasts.deleteFailed"),
        description: getErrorMessage(error),
        variant: "destructive",
      })
    }
  }

  const courseOptions = useMemo(
    () => allCourses.filter((c) => typeof c.id === "number"),
    [allCourses],
  )

  if (loading) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-3">
        <Loader2 className="inline h-4 w-4 animate-spin" /> {t("loading")}
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-lg font-semibold text-ink">{t("title")}</h2>
        <Button onClick={() => void saveLandingPage()} disabled={saving} size="sm">
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
          {t("save")}
        </Button>
      </div>

      <div className="space-y-8 px-4 py-5">
        {/* Hero video */}
        <div className="space-y-3">
          <h3 className="font-medium text-ink">{t("hero.heading")}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>{t("hero.videoUrl")}</Label>
              <Input
                value={heroVideoUrl}
                onChange={(e) => setHeroVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>{t("hero.uploadNew")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void handleHeroUpload(file)
                  }}
                  disabled={uploading}
                />
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-ink-3" />}
              </div>
            </div>
            <div>
              <Label>{t("hero.titleAr")}</Label>
              <Input value={heroTitleAr} onChange={(e) => setHeroTitleAr(e.target.value)} />
            </div>
            <div>
              <Label>{t("hero.titleEn")}</Label>
              <Input value={heroTitleEn} onChange={(e) => setHeroTitleEn(e.target.value)} />
            </div>
            <div>
              <Label>{t("hero.teacherAr")}</Label>
              <Input value={heroTeacherAr} onChange={(e) => setHeroTeacherAr(e.target.value)} />
            </div>
            <div>
              <Label>{t("hero.teacherEn")}</Label>
              <Input value={heroTeacherEn} onChange={(e) => setHeroTeacherEn(e.target.value)} />
            </div>
            <div>
              <Label>{t("hero.durationAr")}</Label>
              <Input value={heroDurationAr} onChange={(e) => setHeroDurationAr(e.target.value)} />
            </div>
            <div>
              <Label>{t("hero.durationEn")}</Label>
              <Input value={heroDurationEn} onChange={(e) => setHeroDurationEn(e.target.value)} />
            </div>
          </div>
          {heroVideoUrl ? (
            <video src={heroVideoUrl} controls className="mt-3 max-h-64 w-full rounded-lg bg-black" />
          ) : null}
        </div>

        {/* Sheikhs & scholars section (replaces the stats bar) */}
        <div className="space-y-4 rounded-lg border border-line bg-canvas p-4">
          <div>
            <h3 className="font-medium text-ink">{t("teachers.heading")}</h3>
            <p className="mt-1 text-sm text-ink-2">{t("teachers.description")}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>{t("teachers.titleAr")}</Label>
              <Input
                value={teachersTitleAr}
                onChange={(e) => setTeachersTitleAr(e.target.value)}
                placeholder={TEACHERS_SECTION_DEFAULTS.ar.title}
                dir="rtl"
              />
            </div>
            <div>
              <Label>{t("teachers.titleEn")}</Label>
              <Input
                value={teachersTitleEn}
                onChange={(e) => setTeachersTitleEn(e.target.value)}
                placeholder={TEACHERS_SECTION_DEFAULTS.en.title}
                dir="ltr"
              />
            </div>
            <div>
              <Label>{t("teachers.subtitleAr")}</Label>
              <Input
                value={teachersSubtitleAr}
                onChange={(e) => setTeachersSubtitleAr(e.target.value)}
                placeholder={TEACHERS_SECTION_DEFAULTS.ar.subtitle}
                dir="rtl"
              />
            </div>
            <div>
              <Label>{t("teachers.subtitleEn")}</Label>
              <Input
                value={teachersSubtitleEn}
                onChange={(e) => setTeachersSubtitleEn(e.target.value)}
                placeholder={TEACHERS_SECTION_DEFAULTS.en.subtitle}
                dir="ltr"
              />
            </div>
          </div>
          <p className="text-xs text-ink-2">{t("teachers.defaultHint", { title: TEACHERS_SECTION_DEFAULTS.ar.title })}</p>

          <OrderedPicker
            title={t("teachers.pickerTitle")}
            options={allInstructors.map((i) => ({
              id: i.id,
              label: `${i.firstName} ${i.lastName}`.trim() || i.email,
            }))}
            selected={featuredInstructorIds}
            onChange={setFeaturedInstructorIds}
          />
          <p className="text-xs text-ink-2">
            {t("teachers.profileHint")}{" "}
            <Link href="/admin/team" className="font-medium text-brand underline-offset-2 hover:underline">
              {t("teachers.profileLink")}
            </Link>
            . {t("teachers.hiddenHint")}
          </p>
        </div>

        {/* Featured courses */}
        <OrderedPicker
          title={t("featuredCourses")}
          options={courseOptions.map((c) => ({ id: c.id as number, label: `${c.title} — ${c.instructor ?? ""}` }))}
          selected={featuredCourseIds}
          onChange={setFeaturedCourseIds}
        />

        {/* Featured articles */}
        <OrderedPicker
          title={t("featuredArticles")}
          options={allArticles.map((a) => ({
            id: a.id,
            label: a.authorName ? `${a.title} — ${a.authorName}` : a.title,
          }))}
          selected={featuredArticleIds}
          onChange={setFeaturedArticleIds}
        />

        {/* Specializations */}
        <div className="space-y-3">
          <h3 className="font-medium text-ink">{t("specs.heading")}</h3>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-6 items-end">
            <div className="md:col-span-2">
              <Label>{t("specs.nameAr")}</Label>
              <Input value={specForm.nameAr} onChange={(e) => setSpecForm({ ...specForm, nameAr: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>{t("specs.nameEn")}</Label>
              <Input value={specForm.nameEn} onChange={(e) => setSpecForm({ ...specForm, nameEn: e.target.value })} />
            </div>
            <div>
              <Label>{t("specs.slug")}</Label>
              <Input value={specForm.slug} onChange={(e) => setSpecForm({ ...specForm, slug: e.target.value })} />
            </div>
            <div>
              <Label>{t("specs.order")}</Label>
              <Input
                type="number"
                value={specForm.displayOrder ?? 0}
                onChange={(e) => setSpecForm({ ...specForm, displayOrder: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void submitSpec()}>
              {editingSpecId == null ? t("specs.add") : t("specs.update")}
            </Button>
            {editingSpecId != null ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingSpecId(null)
                  setSpecForm(emptySpecForm)
                }}
              >
                {t("specs.cancel")}
              </Button>
            ) : null}
          </div>

          <ResponsiveTable
            rows={specializations}
            getRowKey={(s, i) => s.id ?? i}
            bordered
            emptyState={
              <p className="rounded-lg border border-line px-3 py-4 text-center text-sm text-ink-3">
                {t("specs.empty")}
              </p>
            }
            columns={[
              { header: t("specs.order"), cell: (s) => s.displayOrder },
              { header: t("specs.nameAr"), cell: (s) => <span className="text-ink">{s.nameAr}</span> },
              { header: t("specs.nameEn"), cell: (s) => s.nameEn },
              { header: t("specs.slug"), cell: (s) => <span className="font-mono text-xs text-ink-3">{s.slug}</span> },
              { header: t("specs.active"), cell: (s) => (s.active ? t("specs.yes") : t("specs.no")) },
            ]}
            actionsHeader={t("specs.actions")}
            actions={(s) => (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingSpecId(s.id)
                    setSpecForm({
                      nameAr: s.nameAr,
                      nameEn: s.nameEn,
                      slug: s.slug,
                      icon: s.icon ?? "",
                      displayOrder: s.displayOrder,
                      active: s.active,
                    })
                  }}
                >
                  {t("specs.edit")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void deleteSpec(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          />
        </div>
      </div>
    </section>
  )
}

function OrderedPicker({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: { id: number; label: string }[]
  selected: number[]
  onChange: (next: number[]) => void
}) {
  const t = useTranslations("admin.landingEditor")
  const optionsById = useMemo(() => {
    const m = new Map<number, string>()
    options.forEach((o) => m.set(o.id, o.label))
    return m
  }, [options])

  const available = options.filter((o) => !selected.includes(o.id))

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...selected]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-ink">{title}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label>{t("picker.add")}</Label>
          <select
            className="w-full rounded-md border border-line-strong bg-paper px-3 py-2 text-sm"
            onChange={(e) => {
              const id = Number(e.target.value)
              if (!Number.isNaN(id) && id > 0) {
                onChange([...selected, id])
                e.target.value = ""
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              {t("picker.placeholder")}
            </option>
            {available.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("picker.selected", { count: selected.length })}</Label>
          <ul className="space-y-1.5">
            {selected.length === 0 ? (
              <li className="text-sm text-ink-3">{t("picker.noneSelected")}</li>
            ) : null}
            {selected.map((id, idx) => (
              <li
                key={id}
                className="flex items-center gap-2 rounded-md border border-line-strong bg-paper px-2 py-1.5 text-sm"
              >
                <span className="w-6 text-ink-3">{idx + 1}.</span>
                <span className="flex-1 truncate">{optionsById.get(id) ?? `#${id}`}</span>
                <Button variant="outline" size="sm" onClick={() => move(idx, -1)} disabled={idx === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => move(idx, 1)}
                  disabled={idx === selected.length - 1}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(selected.filter((s) => s !== id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
