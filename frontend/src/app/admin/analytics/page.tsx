"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  DollarSign,
  GraduationCap,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useAuth } from "@/components/auth-context"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { getErrorMessage } from "@/lib/api-axios"
import {
  AnalyticsOverview,
  CoursePopularity,
  RevenueDataPoint,
  RevenueTrend,
  analyticsApi,
} from "@/lib/analytics"

interface ChartPoint {
  date: string
  label: string
  [currency: string]: number | string
}

const CURRENCY_COLORS = ["#c96442", "#3b82f6", "#10b981", "#a855f7", "#f59e0b"]

function formatCurrency(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

function formatNumber(value: number, locale: string) {
  try {
    return new Intl.NumberFormat(locale).format(value)
  } catch {
    return value.toString()
  }
}

function buildChartSeries(points: RevenueDataPoint[], locale: string) {
  const currencies = new Set<string>()
  const byDate = new Map<string, ChartPoint>()

  for (const p of points) {
    currencies.add(p.currency)
    const existing = byDate.get(p.date) ?? {
      date: p.date,
      label: new Date(p.date).toLocaleDateString(locale, { month: "short", day: "numeric" }),
    }
    existing[p.currency] = ((existing[p.currency] as number | undefined) ?? 0) + p.amount
    byDate.set(p.date, existing)
  }

  const series = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  return { series, currencies: Array.from(currencies) }
}

export default function AnalyticsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const { toast } = useToast()

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [trend, setTrend] = useState<RevenueTrend | null>(null)
  const [topCourses, setTopCourses] = useState<CoursePopularity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [overviewData, trendData, coursesData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getRevenueTrend(30),
        analyticsApi.getTopCourses(5),
      ])
      setOverview(overviewData)
      setTrend(trendData)
      setTopCourses(coursesData)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      toast({ title: t("admin.analytics.loadFailed"), description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.replace("/")
      return
    }
    void fetchAnalytics()
  }, [authLoading, isAuthenticated, user?.role, router, fetchAnalytics])

  const chart = useMemo(() => {
    if (!trend) return { series: [], currencies: [] }
    return buildChartSeries(trend.dataPoints, locale)
  }, [trend, locale])

  const totalRevenueLine = useMemo(() => {
    if (!overview) return null
    const entries = Object.entries(overview.revenueByCurrency)
    if (entries.length === 0) return formatCurrency(0, "USD", locale)
    return entries
      .map(([currency, amount]) => formatCurrency(amount, currency, locale))
      .join(" • ")
  }, [overview, locale])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f5f4ed]">
        <Navbar />
        <div className="container mx-auto flex max-w-7xl items-center justify-center px-4 pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-[#c96442]" />
        </div>
      </div>
    )
  }

  if (!user || user.role !== "ADMIN") return null

  return (
    <div className="min-h-screen bg-[#f5f4ed]">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="mb-2 inline-flex items-center gap-1 text-sm text-[#5e5d59] hover:text-[#c96442]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {t("admin.analytics.backToDashboard")}
            </Link>
            <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-[#141413]">
              <BarChart3 className="h-8 w-8 text-[#c96442]" />
              {t("admin.analytics.title")}
            </h1>
            <p className="mt-2 text-[#5e5d59]">{t("admin.analytics.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void fetchAnalytics()}>
            {t("admin.analytics.refresh")}
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-[#f3c9be] bg-[#fdf3ef] px-4 py-3 text-sm text-[#b53333]">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={t("admin.analytics.cards.revenue")}
            icon={<DollarSign className="h-5 w-5 text-[#c96442]" />}
            primary={totalRevenueLine ?? "—"}
          />
          <StatCard
            label={t("admin.analytics.cards.enrollments")}
            icon={<GraduationCap className="h-5 w-5 text-[#87867f]" />}
            primary={formatNumber(overview?.totalEnrollments ?? 0, locale)}
          />
          <StatCard
            label={t("admin.analytics.cards.students")}
            icon={<Users className="h-5 w-5 text-[#87867f]" />}
            primary={formatNumber(overview?.totalStudents ?? 0, locale)}
            secondary={
              overview
                ? t("admin.analytics.cards.newThisMonth", {
                    count: overview.newUsersThisMonth,
                  })
                : undefined
            }
          />
          <StatCard
            label={t("admin.analytics.cards.activeCourses")}
            icon={<BookOpen className="h-5 w-5 text-[#87867f]" />}
            primary={formatNumber(overview?.totalCourses ?? 0, locale)}
            secondary={
              overview
                ? t("admin.analytics.cards.activeUsers", {
                    count: overview.activeUsers,
                  })
                : undefined
            }
          />
        </div>

        <section className="mb-8 rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#141413]">
              <TrendingUp className="h-5 w-5 text-[#c96442]" />
              {t("admin.analytics.revenueTrend.title")}
            </h2>
            <span className="text-sm text-[#87867f]">
              {t("admin.analytics.revenueTrend.last30Days")}
            </span>
          </div>
          {chart.series.length === 0 ? (
            <div className="flex h-64 sm:h-72 items-center justify-center text-sm text-[#87867f]">
              {t("admin.analytics.revenueTrend.empty")}
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.series} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6dc" />
                  <XAxis dataKey="label" stroke="#87867f" fontSize={12} tickMargin={8} />
                  <YAxis stroke="#87867f" fontSize={12} tickMargin={8} />
                  <Tooltip
                    contentStyle={{
                      background: "#faf9f5",
                      border: "1px solid #f0eee6",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  />
                  {chart.currencies.map((currency, idx) => (
                    <Line
                      key={currency}
                      type="monotone"
                      dataKey={currency}
                      name={currency}
                      stroke={CURRENCY_COLORS[idx % CURRENCY_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#f0eee6] bg-[#faf9f5]">
          <div className="border-b border-[#f0eee6] px-4 py-3">
            <h2 className="text-lg font-semibold text-[#141413]">
              {t("admin.analytics.topCourses.title")}
            </h2>
          </div>
          <ResponsiveTable
            rows={topCourses}
            getRowKey={(course, i) => course.courseId ?? i}
            emptyState={
              <p className="px-4 py-6 text-sm text-[#87867f]">{t("admin.analytics.topCourses.empty")}</p>
            }
            columns={[
              {
                header: t("admin.analytics.topCourses.courseTitle"),
                cell: (course) => <span className="text-[#141413]">{course.title}</span>,
              },
              {
                header: t("admin.analytics.topCourses.enrollments"),
                cell: (course) => formatNumber(course.enrollmentCount, locale),
              },
              {
                header: t("admin.analytics.topCourses.completionRate"),
                cell: (course) => `${course.completionRate.toFixed(1)}%`,
              },
              {
                header: t("admin.analytics.topCourses.averageProgress"),
                cell: (course) => `${course.averageProgress.toFixed(1)}%`,
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  icon,
  primary,
  secondary,
}: {
  label: string
  icon: React.ReactNode
  primary: string
  secondary?: string
}) {
  return (
    <div className="rounded-xl border border-[#f0eee6] bg-[#faf9f5] p-4">
      <p className="text-sm text-[#87867f]">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[#141413]">
        {icon}
        <span className="break-words">{primary}</span>
      </p>
      {secondary && <p className="mt-2 text-xs text-[#87867f]">{secondary}</p>}
    </div>
  )
}
