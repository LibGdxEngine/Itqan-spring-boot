"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { BookOpen, ClipboardCheck, Percent, TrendingUp, Users } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Badge, PageHeader, Panel, Select, StatCard, formatMoney } from "@/components/admin/ui"
import { StudioShell, useSiteCurrency } from "@/components/studio/StudioShell"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { getErrorMessage } from "@/lib/api-axios"
import { Granularity, isoDate } from "@/lib/admin-api"
import { InstructorOverview, instructorAnalyticsApi } from "@/lib/studio-api"

// Categorical slots from the validated reference palette (fixed order, never cycled).
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"]
const GRID = "#ebe9e0"
const AXIS_TEXT = "#87867f"
const PRESETS = [7, 30, 90, 365] as const

function formatBucket(date: string, granularity: Granularity, locale: string) {
  const d = new Date(`${date}T00:00:00`)
  const loc = locale === "ar" ? "ar-EG" : "en-GB"
  return granularity === "MONTHLY"
    ? d.toLocaleDateString(loc, { month: "short", year: "2-digit" })
    : d.toLocaleDateString(loc, { day: "numeric", month: "short" })
}

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  format: (value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-line-strong bg-paper px-3 py-2 text-xs shadow-md">
      <p className="text-ink-3">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink" dir="ltr">
        {format(payload[0].value)}
      </p>
    </div>
  )
}

function revenueText(byCurrency: Record<string, number>, fallback: string, locale: string) {
  const entries = Object.entries(byCurrency)
  if (entries.length === 0) return formatMoney(0, fallback, locale)
  return entries.map(([currency, amount]) => formatMoney(amount, currency, locale)).join(" · ")
}

function InstructorAnalytics() {
  const t = useTranslations("studio.analytics")
  const locale = useLocale()
  const currency = useSiteCurrency()
  const [days, setDays] = React.useState<number>(30)
  const [data, setData] = React.useState<InstructorOverview | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const granularity: Granularity = days > 120 ? "MONTHLY" : days > 31 ? "WEEKLY" : "DAILY"

  React.useEffect(() => {
    let cancelled = false
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - (days - 1))
    setLoading(true)
    instructorAnalyticsApi
      .overview({ from: isoDate(from), to: isoDate(to), granularity })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [days, granularity])

  const enrollmentPoints =
    data?.enrollmentSeries.points.map((p) => ({ label: formatBucket(p.date, granularity, locale), value: p.value })) ?? []

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Select aria-label={t("range")} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {t("lastDays", { count: p })}
              </option>
            ))}
          </Select>
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      {!data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-subtle" />
          ))}
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label={t("kpi.students")}
              value={data.summary.totalStudents.toLocaleString(locale)}
              hint={t("kpi.allTime")}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              label={t("kpi.newEnrollments")}
              value={data.summary.newEnrollments.toLocaleString(locale)}
              hint={t("lastDays", { count: days })}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              label={t("kpi.progress")}
              value={`${Math.round(data.summary.averageProgress)}%`}
              hint={t("kpi.progressHint")}
              icon={<Percent className="h-4 w-4" />}
            />
            <StatCard
              label={t("kpi.quizScore")}
              value={data.summary.averageQuizScore == null ? "—" : `${Math.round(data.summary.averageQuizScore)}%`}
              hint={t("kpi.quizHint")}
              icon={<ClipboardCheck className="h-4 w-4" />}
            />
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Panel title={t("enrollmentsChart")}>
              <div className="h-64 p-4" role="img" aria-label={t("enrollmentsChart")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentPoints} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip cursor={{ fill: "#f0eee6" }} content={<ChartTooltip format={(v) => v.toLocaleString(locale)} />} />
                    <Bar dataKey="value" fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={t("revenueChart")}>
              {data.revenueSeries.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-1 p-4 text-center">
                  <p className="text-2xl font-bold text-ink" dir="ltr">{formatMoney(0, currency, locale)}</p>
                  <p className="text-sm text-ink-3">{t("noRevenue")}</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {data.revenueSeries.map((series, index) => {
                    const points = series.points.map((p) => ({ label: formatBucket(p.date, granularity, locale), value: p.value }))
                    const total = series.points.reduce((sum, p) => sum + p.value, 0)
                    return (
                      <div key={series.key}>
                        <p className="mb-1 text-sm text-ink-2">
                          <span className="font-semibold text-ink" dir="ltr">{formatMoney(total, series.key, locale)}</span>{" "}
                          {t("inRange")}
                        </p>
                        <div className={data.revenueSeries.length > 1 ? "h-32" : "h-52"} role="img" aria-label={`${t("revenueChart")} ${series.key}`}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                              <CartesianGrid stroke={GRID} vertical={false} />
                              <XAxis dataKey="label" tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                              <YAxis tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
                              <Tooltip content={<ChartTooltip format={(v) => formatMoney(v, series.key, locale)} />} />
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke={SERIES_COLORS[Math.min(index, SERIES_COLORS.length - 1)]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>
          </div>

          <Panel title={t("byCourse")}>
            {data.courses.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-ink-3">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-brand" />
                {t("noCourses")}
              </div>
            ) : (
              <ResponsiveTable
                rows={data.courses}
                getRowKey={(row) => row.courseId}
                columns={[
                  {
                    header: t("cols.course"),
                    cell: (row) => (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/instructor/courses/${row.courseId}/analytics`} className="font-medium text-ink hover:text-brand">
                          {row.title}
                        </Link>
                        {row.published ? null : <Badge tone="amber">{t("draft")}</Badge>}
                      </div>
                    ),
                  },
                  { header: t("cols.students"), cell: (row) => <span dir="ltr">{row.students}</span> },
                  { header: t("cols.newEnrollments"), cell: (row) => <span dir="ltr">{row.newEnrollments}</span> },
                  {
                    header: t("cols.progress"),
                    cell: (row) => (
                      <div className="flex min-w-[120px] items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-grid">
                          <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${Math.min(100, row.averageProgress)}%` }} />
                        </div>
                        <span className="w-10 text-end text-xs text-ink-2" dir="ltr">{Math.round(row.averageProgress)}%</span>
                      </div>
                    ),
                  },
                  { header: t("cols.completed"), cell: (row) => <span dir="ltr">{row.completedStudents}</span> },
                  {
                    header: t("cols.quizScore"),
                    cell: (row) => <span dir="ltr">{row.averageQuizScore == null ? "—" : `${Math.round(row.averageQuizScore)}%`}</span>,
                  },
                  { header: t("cols.revenue"), cell: (row) => <span dir="ltr">{revenueText(row.revenueByCurrency, currency, locale)}</span> },
                ]}
              />
            )}
          </Panel>
        </div>
      )}
    </>
  )
}

export default function InstructorAnalyticsPage() {
  return (
    <StudioShell>
      <InstructorAnalytics />
    </StudioShell>
  )
}
