"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowUpRight, BookOpen, CreditCard, GraduationCap, KeyRound, UserPlus, Users, Wallet } from "lucide-react"

import { useAuth } from "@/components/auth-context"
import { Badge, PageHeader, Panel, StatCard, formatDateTime, formatMoney } from "@/components/admin/ui"
import { getErrorMessage } from "@/lib/api-axios"
import {
  AnalyticsSummary,
  AuditLogRow,
  CoursePopularity,
  auditLogApi,
  isoDate,
  reportsApi,
} from "@/lib/admin-api"

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

export default function AdminOverviewPage() {
  const t = useTranslations("admin.overview")
  const locale = useLocale()
  const { user } = useAuth()
  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null)
  const [topCourses, setTopCourses] = React.useState<CoursePopularity[]>([])
  const [activity, setActivity] = React.useState<AuditLogRow[]>([])
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 29)
    const range = { from: isoDate(from), to: isoDate(to) }

    Promise.all([reportsApi.summary(range), reportsApi.topCourses(5), auditLogApi.search({ size: 8 })])
      .then(([s, courses, logs]) => {
        setSummary(s)
        setTopCourses(courses)
        setActivity(logs.content)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const revenueEntries = summary ? Object.entries(summary.revenueByCurrency) : []
  const primaryRevenue = revenueEntries[0]

  const quickActions = [
    { href: "/admin/payments?new=1", label: t("quick.recordPayment"), icon: Wallet },
    { href: "/admin/enrollments?new=1", label: t("quick.grantAccess"), icon: UserPlus },
    { href: "/admin/enrollment-codes", label: t("quick.generateCodes"), icon: KeyRound },
    { href: "/admin/courses", label: t("quick.manageCourses"), icon: BookOpen },
  ]

  return (
    <>
      <PageHeader title={t("title", { name: user?.firstName ?? "" })} description={t("subtitle")} />

      {error ? (
        <p className="mb-6 rounded-lg border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary ? (
          <>
            <StatCard
              label={t("cards.revenue")}
              icon={<CreditCard className="h-5 w-5" />}
              value={primaryRevenue ? formatMoney(primaryRevenue[1], primaryRevenue[0], locale) : formatMoney(0, "EGP", locale)}
              delta={
                primaryRevenue
                  ? percentChange(primaryRevenue[1], summary.previousRevenueByCurrency[primaryRevenue[0]] ?? 0)
                  : null
              }
              hint={
                revenueEntries.length > 1
                  ? revenueEntries.slice(1).map(([c, v]) => formatMoney(v, c, locale)).join(" · ")
                  : t("cards.last30")
              }
            />
            <StatCard
              label={t("cards.newEnrollments")}
              icon={<GraduationCap className="h-5 w-5" />}
              value={summary.newEnrollments}
              delta={percentChange(summary.newEnrollments, summary.previousNewEnrollments)}
              hint={t("cards.totalEnrollments", { count: summary.totalEnrollments })}
            />
            <StatCard
              label={t("cards.newUsers")}
              icon={<Users className="h-5 w-5" />}
              value={summary.newUsers}
              delta={percentChange(summary.newUsers, summary.previousNewUsers)}
              hint={t("cards.totalStudents", { count: summary.totalStudents })}
            />
            <StatCard
              label={t("cards.activeUsers")}
              icon={<BookOpen className="h-5 w-5" />}
              value={summary.activeUsers30d}
              hint={t("cards.activeCourses", { count: summary.activeCourses })}
            />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[118px] animate-pulse rounded-xl border border-line bg-surface" />
          ))
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 text-sm font-medium text-ink transition hover:border-brand/40 hover:shadow-sm"
          >
            <span className="rounded-lg bg-brand-soft p-2 text-brand">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          title={t("topCourses")}
          actions={
            <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              {t("viewAnalytics")}
              <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          }
        >
          {topCourses.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-3">{t("noEnrollments")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {topCourses.map((course) => (
                <li key={course.courseId} className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${Math.min(100, Math.round(course.averageProgress))}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-end text-xs text-ink-2">
                    <p className="text-sm font-semibold text-ink">{course.enrollmentCount}</p>
                    <p>{t("avgProgress", { value: Math.round(course.averageProgress) })}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          title={t("recentActivity")}
          actions={
            <Link href="/admin/audit-log" className="text-sm text-brand hover:underline">
              {t("viewAll")}
            </Link>
          }
        >
          {activity.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-3">{t("noActivity")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((log) => (
                <li key={log.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink">{log.action.replaceAll("_", " ").toLowerCase()}</span>
                    <Badge tone={log.status === "SUCCESS" ? "green" : "red"}>{log.status === "SUCCESS" ? "✓" : "✕"}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-3">
                    {log.actorEmail ?? t("system")} · {formatDateTime(log.createdAt, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
