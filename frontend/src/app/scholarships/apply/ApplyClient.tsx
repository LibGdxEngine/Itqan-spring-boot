"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"

import { PublicPage } from "@/components/layout/PublicPage"
import { useAuth } from "@/components/auth-context"
import { Badge, BadgeTone, FormField, Select, formatDate } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { catalogApi, type CatalogCourse } from "@/lib/learning-api"
import { scholarshipsApi, type MyScholarshipApplication, type ScholarshipStatus } from "@/lib/scholarships-api"

const STATUS_TONE: Record<ScholarshipStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  WITHDRAWN: "gray",
}

const MIN_REASON = 20

export default function ApplyClient() {
  const t = useTranslations("scholarships.apply")
  const ts = useTranslations("scholarships.status")
  const locale = useLocale()
  const { toast } = useToast()
  const { isAuthenticated, isLoading, user } = useAuth()
  const searchParams = useSearchParams()
  const preselected = Number(searchParams.get("courseId")) || ""

  const [courses, setCourses] = React.useState<CatalogCourse[]>([])
  const [mine, setMine] = React.useState<MyScholarshipApplication[] | null>(null)
  const [courseId, setCourseId] = React.useState<number | "">(preselected)
  const [reason, setReason] = React.useState("")
  const [circumstances, setCircumstances] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const isStudent = isAuthenticated && user?.role === "STUDENT"

  React.useEffect(() => {
    catalogApi
      .search({ price: "paid", size: 100, sort: "newest" })
      .then((page) => setCourses(page.content))
      .catch(() => setCourses([]))
  }, [])

  React.useEffect(() => {
    if (!isStudent) return
    scholarshipsApi.mine().then(setMine).catch(() => setMine([]))
  }, [isStudent])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (courseId === "" || reason.trim().length < MIN_REASON) return
    setSubmitting(true)
    try {
      const created = await scholarshipsApi.apply({
        courseId,
        reason: reason.trim(),
        circumstances: circumstances.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      setMine((list) => [created, ...(list ?? [])])
      setReason("")
      setCircumstances("")
      toast({ title: t("submitted"), description: t("submittedHint") })
    } catch (error) {
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(error) })
    } finally {
      setSubmitting(false)
    }
  }

  const withdraw = async (application: MyScholarshipApplication) => {
    setBusyId(application.id)
    try {
      const updated = await scholarshipsApi.withdraw(application.id)
      setMine((list) => (list ?? []).map((a) => (a.id === updated.id ? updated : a)))
    } catch (error) {
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(error) })
    } finally {
      setBusyId(null)
    }
  }

  const redirect = `/scholarships/apply${courseId ? `?courseId=${courseId}` : ""}`

  return (
    <PublicPage>
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-28 sm:px-6">
        <Link href="/scholarships" className="text-sm text-brand hover:underline">
          {t("back")}
        </Link>
        <h1 className="mt-3 text-3xl text-ink sm:text-4xl" style={{ fontFamily: "var(--font-serif-ar)", fontWeight: 500 }}>
          {t("title")}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-2">{t("intro")}</p>

        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !isAuthenticated ? (
          <div className="mt-8 rounded-xl border border-line bg-surface p-6 text-center">
            <p className="text-ink-2">{t("loginRequired")}</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent(redirect)}`}
                className="inline-flex h-10 items-center rounded-lg bg-brand px-5 font-medium text-on-night hover:bg-brand-hover"
              >
                {t("login")}
              </Link>
              <Link
                href={`/register?redirect=${encodeURIComponent(redirect)}`}
                className="inline-flex h-10 items-center rounded-lg border border-line-strong px-5 font-medium text-ink hover:bg-subtle"
              >
                {t("register")}
              </Link>
            </div>
          </div>
        ) : !isStudent ? (
          <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-ink-2">{t("studentsOnly")}</p>
        ) : (
          <>
            <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-5 rounded-xl border border-line bg-surface p-6">
              <FormField label={t("course")} htmlFor="sch-course">
                <Select
                  id="sch-course"
                  required
                  className="w-full"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">{t("chooseCourse")}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t("reason")} htmlFor="sch-reason" hint={t("reasonHint", { min: MIN_REASON })}>
                <Textarea
                  id="sch-reason"
                  required
                  minLength={MIN_REASON}
                  maxLength={3000}
                  rows={5}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </FormField>
              <FormField label={t("circumstances")} htmlFor="sch-circ" hint={t("circumstancesHint")}>
                <Textarea
                  id="sch-circ"
                  maxLength={3000}
                  rows={4}
                  value={circumstances}
                  onChange={(e) => setCircumstances(e.target.value)}
                />
              </FormField>
              <FormField label={t("phone")} htmlFor="sch-phone" hint={t("phoneHint")}>
                <Input id="sch-phone" type="tel" dir="ltr" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <p className="text-xs text-ink-3">{t("privacy")}</p>
              <Button type="submit" className="w-full" disabled={submitting || courseId === "" || reason.trim().length < MIN_REASON}>
                {submitting ? <Loader2 className="animate-spin" /> : null}
                {t("submit")}
              </Button>
            </form>

            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-ink">{t("mine")}</h2>
              {mine === null ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              ) : mine.length === 0 ? (
                <p className="text-sm text-ink-3">{t("noneYet")}</p>
              ) : (
                <ul className="space-y-3">
                  {mine.map((a) => (
                    <li key={a.id} className="rounded-xl border border-line bg-surface p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-ink">{a.courseTitle}</span>
                        <Badge tone={STATUS_TONE[a.status]}>{ts(a.status)}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-3">{t("sentOn", { date: formatDate(a.createdAt, locale) })}</p>
                      {a.adminNote ? <p className="mt-2 text-sm text-ink-2">{t("note", { note: a.adminNote })}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.status === "APPROVED" ? (
                          <Link href={`/learn/${a.courseId}`} className="text-sm font-medium text-brand hover:underline">
                            {t("startLearning")}
                          </Link>
                        ) : null}
                        {a.status === "PENDING" ? (
                          <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => void withdraw(a)}>
                            {busyId === a.id ? <Loader2 className="animate-spin" /> : null}
                            {t("withdraw")}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </PublicPage>
  )
}
