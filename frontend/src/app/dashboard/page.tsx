"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Award, BookOpen, CheckCircle2, Flame, Heart, KeyRound, Loader2, PlayCircle, TrendingUp } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { Badge, BadgeTone, formatDate, formatMoney } from "@/components/admin/ui"
import { CourseCard } from "@/components/courses/CourseCard"
import { EnrolledCourseCard, ProgressBar, resumeHref } from "@/components/courses/EnrolledCourseCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import {
  CatalogCourse,
  Certificate,
  LearningDashboard,
  certificatesApi,
  enrollmentCodesApi,
  learningApi,
  wishlistApi,
} from "@/lib/learning-api"
import { PaymentResponse, paymentsBillingApi } from "@/lib/payments-billing"
import { cn } from "@/lib/utils"

type Tab = "all" | "active" | "completed"

const STATUS_TONES: Record<PaymentResponse["status"], BadgeTone> = {
  COMPLETED: "green",
  PENDING: "amber",
  FAILED: "red",
  REFUNDED: "gray",
  CANCELLED: "gray",
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-ink" dir="ltr">{value}</p>
        <p className="text-xs text-ink-3">{label}</p>
      </div>
    </div>
  )
}

function RedeemCode({ onRedeemed }: { onRedeemed: (courseId?: number) => void }) {
  const t = useTranslations("dashboard.redeem")
  const { toast } = useToast()
  const [code, setCode] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    try {
      const enrollment = await enrollmentCodesApi.redeem(code.trim())
      setCode("")
      toast({ title: t("success") })
      onRedeemed(enrollment.courseId)
    } catch (err) {
      toast({ variant: "destructive", title: t("failed"), description: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="rounded-2xl border border-line-strong bg-surface p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold text-ink">
        <KeyRound className="h-4 w-4 text-brand" /> {t("title")}
      </h2>
      <p className="mb-3 text-sm text-ink-3">{t("description")}</p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX"
          aria-label={t("title")}
          dir="ltr"
          className="font-mono"
        />
        <Button type="submit" disabled={busy || !code.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : null} {t("submit")}
        </Button>
      </div>
    </form>
  )
}

export default function DashboardPage() {
  const t = useTranslations("dashboard")
  const locale = useLocale()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [data, setData] = React.useState<LearningDashboard | null>(null)
  const [certificates, setCertificates] = React.useState<Certificate[]>([])
  const [wishlist, setWishlist] = React.useState<CatalogCourse[]>([])
  const [payments, setPayments] = React.useState<PaymentResponse[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [tab, setTab] = React.useState<Tab>("all")

  React.useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) router.replace("/login")
    else if (user?.role === "INSTRUCTOR") router.replace("/instructor")
    else if (user?.role === "ADMIN") router.replace("/admin")
  }, [authLoading, isAuthenticated, user?.role, router])

  const load = React.useCallback(async () => {
    try {
      const [dashboard, certs, saved, paid] = await Promise.all([
        learningApi.dashboard(),
        certificatesApi.mine().catch(() => []),
        wishlistApi.list().catch(() => []),
        paymentsBillingApi.getMyPayments().catch(() => []),
      ])
      setData(dashboard)
      setCertificates(certs)
      setWishlist(saved)
      setPayments(paid)
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }, [])

  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "STUDENT") void load()
  }, [authLoading, isAuthenticated, user?.role, load])

  if (authLoading || (!data && !error)) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    )
  }

  const courses = data?.courses ?? []
  const visible = courses.filter((c) =>
    tab === "all" ? true : tab === "completed" ? c.status === "COMPLETED" : c.status !== "COMPLETED",
  )
  const next = data?.continueLearning

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main id="main-content" className="container mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-24">
        <header>
          <h1 className="text-3xl font-bold text-ink">{t("title")}</h1>
          <p className="mt-2 text-ink-2">{t("welcome", { name: user?.firstName || "" })}</p>
        </header>

        {error ? (
          <p className="rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
        ) : null}

        {data ? (
          <section aria-label={t("statsLabel")} className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Stat icon={<PlayCircle className="h-5 w-5" />} label={t("stats.inProgress")} value={data.stats.inProgress} />
            <Stat icon={<CheckCircle2 className="h-5 w-5" />} label={t("stats.completed")} value={data.stats.completed} />
            <Stat icon={<Award className="h-5 w-5" />} label={t("stats.certificates")} value={data.stats.certificates} />
            <Stat icon={<TrendingUp className="h-5 w-5" />} label={t("stats.thisWeek")} value={data.stats.lessonsThisWeek} />
            <Stat icon={<Flame className="h-5 w-5" />} label={t("stats.streak")} value={data.stats.streakDays} />
          </section>
        ) : null}

        {next ? (
          <section className="overflow-hidden rounded-2xl bg-night text-on-night sm:flex">
            <div className="relative aspect-video bg-night-2 sm:w-80 sm:shrink-0">
              {next.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={next.thumbnailUrl} alt="" className="h-full w-full object-cover opacity-90" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="h-12 w-12 text-coral" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3 p-6">
              <p className="text-xs uppercase tracking-wide text-coral">{t("continueLearning")}</p>
              <h2 className="text-xl font-bold sm:text-2xl">{next.title}</h2>
              {next.lastLessonTitle ? <p className="text-sm text-on-night-2">{t("lastLesson", { title: next.lastLessonTitle })}</p> : null}
              <div className="max-w-md space-y-1">
                <ProgressBar value={next.progress} label={t("progressLabel", { title: next.title })} />
                <p className="text-xs text-on-night-2">
                  {t("lessonsDone", { done: next.completedLessons, total: next.totalLessons })}
                </p>
              </div>
              <div>
                <Button asChild className="bg-brand hover:bg-brand-hover">
                  <Link href={resumeHref(next)}>
                    <PlayCircle /> {next.progress > 0 ? t("resume") : t("start")}
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="my-courses-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="my-courses-heading" className="text-xl font-semibold text-ink">{t("myCourses")}</h2>
            {courses.length > 0 ? (
              <div role="tablist" aria-label={t("myCourses")} className="flex gap-1 rounded-lg bg-subtle p-1">
                {(["all", "active", "completed"] as Tab[]).map((key) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      tab === key ? "bg-paper text-ink shadow-sm" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {t(`tabs.${key}`)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-on-night-2" />
              <h3 className="mb-2 text-lg font-medium text-ink">{t("noCourses")}</h3>
              <p className="mx-auto mb-6 max-w-sm text-ink-3">{t("noCoursesDesc")}</p>
              <Button asChild>
                <Link href="/courses">{t("browseCourses")}</Link>
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-3">{t("nothingHere")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((course) => (
                <EnrolledCourseCard
                  key={course.courseId}
                  course={course}
                  onCertificate={(courseId, code) =>
                    setData((d) =>
                      d ? { ...d, courses: d.courses.map((c) => (c.courseId === courseId ? { ...c, certificateCode: code } : c)) } : d,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="certificates-heading" className="rounded-2xl border border-line-strong bg-surface p-5">
            <h2 id="certificates-heading" className="mb-3 flex items-center gap-2 font-semibold text-ink">
              <Award className="h-4 w-4 text-brand" /> {t("certificates")}
            </h2>
            {certificates.length === 0 ? (
              <p className="text-sm text-ink-3">{t("noCertificates")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {certificates.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{c.courseTitle}</p>
                      <p className="text-xs text-ink-3">{formatDate(c.issuedAt, locale)}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/certificates/${c.code}`}>{t("view")}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <RedeemCode
            onRedeemed={(courseId) => {
              void load()
              if (courseId) router.push(`/learn/${courseId}`)
            }}
          />
        </div>

        {wishlist.length > 0 ? (
          <section aria-labelledby="wishlist-heading">
            <h2 id="wishlist-heading" className="mb-4 flex items-center gap-2 text-xl font-semibold text-ink">
              <Heart className="h-5 w-5 text-brand" /> {t("wishlist")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {wishlist.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="billing-heading" className="rounded-2xl border border-line-strong bg-surface p-5">
          <h2 id="billing-heading" className="mb-4 text-xl font-semibold text-ink">{t("billing.title")}</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-ink-3">{t("billing.empty")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{payment.courseTitle}</p>
                    <p className="text-ink-3">{formatDate(payment.createdAt, locale)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-ink" dir="ltr">{formatMoney(payment.amount, payment.currency, locale)}</span>
                    <Badge tone={STATUS_TONES[payment.status] ?? "gray"}>{t(`billing.status.${payment.status}`)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
