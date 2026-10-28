"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Download, Loader2, RefreshCw } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { PageHeader, Panel, Select, StatCard, formatMoney } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveTable } from "@/components/ui/responsive-table"
import { getErrorMessage } from "@/lib/api-axios"
import {
  AnalyticsSummary,
  CoursePopularity,
  CourseRevenue,
  DateRange,
  Granularity,
  Series,
  UserBreakdown,
  downloadCsv,
  isoDate,
  reportsApi,
} from "@/lib/admin-api"

// Categorical slots from the validated reference palette (fixed order, never cycled).
const SERIES_COLORS = ["#2a78d6", "#eb6834", "#1baf7a"]
const GRID = "#ebe9e0"
const AXIS_TEXT = "#87867f"

const PRESETS = [7, 30, 90, 365] as const

function rangeForDays(days: number): DateRange {
  const to = new Date()
  const from = new Date()
  from.setDate(to.getDate() - (days - 1))
  return { from: isoDate(from), to: isoDate(to) }
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

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

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin.analytics")
  const locale = useLocale()
  const [preset, setPreset] = React.useState<number | "custom">(30)
  const [range, setRange] = React.useState<DateRange>(() => rangeForDays(30))
  const [granularity, setGranularity] = React.useState<Granularity>("DAILY")
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null)
  const [revenue, setRevenue] = React.useState<Series[]>([])
  const [enrollments, setEnrollments] = React.useState<Series | null>(null)
  const [byCourse, setByCourse] = React.useState<CourseRevenue[]>([])
  const [users, setUsers] = React.useState<UserBreakdown | null>(null)
  const [topCourses, setTopCourses] = React.useState<CoursePopularity[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      reportsApi.summary(range),
      reportsApi.revenueSeries(range, granularity),
      reportsApi.enrollmentSeries(range, granularity),
      reportsApi.revenueByCourse(range),
      reportsApi.users(range),
      reportsApi.topCourses(10),
    ])
      .then(([s, rev, enr, courses, u, top]) => {
        if (cancelled) return
        setSummary(s)
        setRevenue(rev)
        setEnrollments(enr)
        setByCourse(courses)
        setUsers(u)
        setTopCourses(top)
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [range, granularity, reloadToken])

  const choosePreset = (value: string) => {
    if (value === "custom") {
      setPreset("custom")
      return
    }
    const days = Number(value)
    setPreset(days)
    setRange(rangeForDays(days))
    setGranularity(days > 120 ? "MONTHLY" : days > 31 ? "WEEKLY" : "DAILY")
  }

  const refresh = async () => {
    await reportsApi.refresh().catch(() => undefined)
    setReloadToken((n) => n + 1)
  }

  const exportReport = () => {
    const rows = revenue.flatMap((series) => series.points.map((p) => ({ currency: series.key, ...p })))
    downloadCsv(`revenue_${range.from}_${range.to}.csv`, rows, [
      { header: "period_start", value: (r) => r.date },
      { header: "currency", value: (r) => r.currency },
      { header: "revenue", value: (r) => r.value },
    ])
    downloadCsv(`revenue-by-course_${range.from}_${range.to}.csv`, byCourse, [
      { header: "course", value: (r) => r.courseTitle },
      { header: "currency", value: (r) => r.currency },
      { header: "revenue", value: (r) => r.revenue },
      { header: "payments", value: (r) => r.payments },
    ])
  }

  const revenueEntries = summary ? Object.entries(summary.revenueByCurrency) : []
  const maxCourseRevenue = Math.max(1, ...byCourse.map((c) => c.revenue))
  const roleTotal = users ? Object.values(users.usersByRole).reduce((a, b) => a + b, 0) : 0
  const number = (value: number) => value.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("rangeDescription", { from: range.from, to: range.to })}
        actions={
          <>
            <Button variant="outline" onClick={exportReport} disabled={loading || revenue.length === 0}>
              <Download />
              {t("export")}
            </Button>
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              {t("refresh")}
            </Button>
          </>
        }
      />

      {/* Filters: one row above the charts */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
        <Select aria-label={t("period")} value={String(preset)} onChange={(e) => choosePreset(e.target.value)}>
          {PRESETS.map((days) => (
            <option key={days} value={days}>
              {t("lastDays", { days })}
            </option>
          ))}
          <option value="custom">{t("custom")}</option>
        </Select>
        {preset === "custom" ? (
          <>
            <Input
              type="date"
              dir="ltr"
              aria-label={t("from")}
              className="h-9 w-auto"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && setRange((r) => ({ ...r, from: e.target.value }))}
            />
            <Input
              type="date"
              dir="ltr"
              aria-label={t("to")}
              className="h-9 w-auto"
              value={range.to}
              min={range.from}
              onChange={(e) => e.target.value && setRange((r) => ({ ...r, to: e.target.value }))}
            />
          </>
        ) : null}
        <div className="inline-flex rounded-lg border border-line-strong bg-paper p-0.5" role="group" aria-label={t("granularity")}>
          {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={granularity === g}
              onClick={() => setGranularity(g)}
              className={
                granularity === g
                  ? "rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-md px-3 py-1.5 text-xs text-ink-2 hover:bg-subtle"
              }
            >
              {t(`granularities.${g}`)}
            </button>
          ))}
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-ink-3" /> : null}
      </div>

      {error ? (
        <p className="mb-6 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? (
          <>
            <StatCard
              label={t("cards.revenue")}
              value={
                revenueEntries.length
                  ? formatMoney(revenueEntries[0][1], revenueEntries[0][0], locale)
                  : formatMoney(0, "EGP", locale)
              }
              delta={
                revenueEntries.length
                  ? percentChange(revenueEntries[0][1], summary.previousRevenueByCurrency[revenueEntries[0][0]] ?? 0)
                  : null
              }
              hint={
                revenueEntries.length > 1
                  ? revenueEntries.slice(1).map(([c, v]) => formatMoney(v, c, locale)).join(" · ")
                  : t("vsPrevious")
              }
            />
            <StatCard
              label={t("cards.newEnrollments")}
              value={number(summary.newEnrollments)}
              delta={percentChange(summary.newEnrollments, summary.previousNewEnrollments)}
              hint={t("vsPrevious")}
            />
            <StatCard
              label={t("cards.newUsers")}
              value={number(summary.newUsers)}
              delta={percentChange(summary.newUsers, summary.previousNewUsers)}
              hint={t("vsPrevious")}
            />
            <StatCard
              label={t("cards.activeUsers")}
              value={number(summary.activeUsers30d)}
              hint={t("cards.activeHint", { students: number(summary.totalStudents), courses: number(summary.activeCourses) })}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[118px] animate-pulse rounded-xl border border-line bg-surface" />
          ))
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Revenue: one small multiple per currency (never two scales on one axis) */}
        <Panel title={t("revenueTrend")}>
          <div className="space-y-6 p-4">
            {revenue.length === 0 ? (
              <p className="py-16 text-center text-sm text-ink-3">{t("noRevenue")}</p>
            ) : (
              revenue.map((series, i) => (
                <div key={series.key}>
                  {revenue.length > 1 ? (
                    <p className="mb-2 text-xs font-medium text-ink-2" dir="ltr">
                      {series.key}
                    </p>
                  ) : null}
                  <div className="h-56" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} stroke={GRID} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d: string) => formatBucket(d, granularity, locale)}
                          tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={56}
                          tickFormatter={(v: number) => v.toLocaleString("en-US", { notation: "compact" })}
                        />
                        <Tooltip
                          cursor={{ stroke: "#c3c2b7", strokeDasharray: "3 3" }}
                          content={
                            <ChartTooltip format={(v) => formatMoney(v, series.key, locale)} />
                          }
                          labelFormatter={(d) => formatBucket(String(d), granularity, locale)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, stroke: "#faf9f5", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title={t("enrollmentTrend")}>
          <div className="h-56 p-4" dir="ltr">
            {enrollments && enrollments.points.some((p) => p.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollments.points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => formatBucket(d, granularity, locale)}
                    tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: "#f0eee6" }}
                    content={<ChartTooltip format={(v) => t("enrollmentsCount", { count: v })} />}
                    labelFormatter={(d) => formatBucket(String(d), granularity, locale)}
                  />
                  <Bar dataKey="value" fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-ink-3">{t("noEnrollments")}</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title={t("revenueByCourse")} className="xl:col-span-2">
          <ResponsiveTable
            rows={byCourse}
            getRowKey={(row) => `${row.courseId}-${row.currency}`}
            emptyState={<p className="px-4 py-10 text-center text-sm text-ink-3">{t("noRevenue")}</p>}
            columns={[
              { header: t("course"), cell: (row) => row.courseTitle },
              {
                header: t("revenue"),
                cell: (row) => (
                  <div className="flex items-center gap-3">
                    <div className="hidden h-2 w-28 overflow-hidden rounded-full bg-subtle sm:block">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(row.revenue / maxCourseRevenue) * 100}%`, backgroundColor: SERIES_COLORS[0] }}
                      />
                    </div>
                    <span dir="ltr">{formatMoney(row.revenue, row.currency, locale)}</span>
                  </div>
                ),
              },
              { header: t("payments"), cell: (row) => number(row.payments), alignEnd: true },
            ]}
          />
        </Panel>

        <Panel title={t("usersByRole")}>
          <div className="space-y-4 p-4">
            {users ? (
              <>
                {Object.entries(users.usersByRole).map(([role, count]) => (
                  <div key={role}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-ink-button">{t.has(`roles.${role}`) ? t(`roles.${role}`) : role}</span>
                      <span className="font-medium text-ink">{number(count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-subtle">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${roleTotal ? (count / roleTotal) * 100 : 0}%`, backgroundColor: SERIES_COLORS[0] }}
                      />
                    </div>
                  </div>
                ))}
                <p className="border-t border-line pt-3 text-xs text-ink-3">
                  {t("signupsInRange", { count: users.newSignups })}
                </p>
              </>
            ) : null}
          </div>
        </Panel>
      </div>

      <Panel title={t("topCourses")}>
        <ResponsiveTable
          rows={topCourses}
          getRowKey={(row) => row.courseId}
          emptyState={<p className="px-4 py-10 text-center text-sm text-ink-3">{t("noEnrollments")}</p>}
          columns={[
            { header: t("course"), cell: (row) => row.title },
            { header: t("students"), cell: (row) => number(row.enrollmentCount), alignEnd: true },
            { header: t("completionRate"), cell: (row) => `${row.completionRate.toFixed(0)}%`, alignEnd: true },
            { header: t("averageProgress"), cell: (row) => `${row.averageProgress.toFixed(0)}%`, alignEnd: true },
          ]}
        />
      </Panel>
    </>
  )
}
