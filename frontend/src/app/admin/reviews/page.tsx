"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { CourseSelect } from "@/components/admin/CourseSelect"
import { Badge, PageHeader, Select, formatDateTime } from "@/components/admin/ui"
import { StarRating } from "@/components/courses/StarRating"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import api, { getErrorMessage } from "@/lib/api-axios"
import type { Page } from "@/lib/admin-api"

interface AdminReviewRow {
  id: number
  courseId: number
  courseTitle: string
  studentId: number
  studentName: string
  studentEmail: string
  rating: number
  comment: string | null
  hidden: boolean
  createdAt: string
}

interface Filters {
  q: string
  courseId: string
  hidden: "" | "true" | "false"
  rating: string
}

const clean = (params: Record<string, string | number>) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""))

export default function AdminReviewsPage() {
  const t = useTranslations("admin.reviews")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()
  const [filters, setFilters] = React.useState<Filters>({ q: "", courseId: "", hidden: "", rating: "" })
  const [busyId, setBusyId] = React.useState<number | null>(null)

  const fetchPage = React.useCallback(
    async (page: number) =>
      (await api.get<Page<AdminReviewRow>>("/api/admin/reviews", { params: clean({ ...filters, page, size: 20 }) })).data,
    [filters],
  )
  const table = useServerTable(fetchPage)

  const toggle = async (row: AdminReviewRow) => {
    setBusyId(row.id)
    try {
      await api.patch(`/api/admin/reviews/${row.id}`, { hidden: !row.hidden })
      table.updateRow((r) => r.id === row.id, { ...row, hidden: !row.hidden })
      toast({ title: row.hidden ? t("shown") : t("hidden") })
    } catch (err) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(err) })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable
        table={table}
        getRowKey={(row) => row.id}
        emptyMessage={t("empty")}
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <CourseSelect
              value={filters.courseId === "" ? "" : Number(filters.courseId)}
              onChange={(courseId) => setFilters((f) => ({ ...f, courseId: String(courseId) }))}
              allLabel={tc("allCourses")}
            />
            <Select aria-label={t("rating")} value={filters.rating} onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}>
              <option value="">{t("anyRating")}</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {t("stars", { count: n })}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("visibility")}
              value={filters.hidden}
              onChange={(e) => setFilters((f) => ({ ...f, hidden: e.target.value as Filters["hidden"] }))}
            >
              <option value="">{t("allVisibility")}</option>
              <option value="false">{t("visible")}</option>
              <option value="true">{t("hiddenFilter")}</option>
            </Select>
          </>
        }
        columns={[
          {
            header: t("cols.review"),
            cell: (row) => (
              <div className="max-w-md space-y-1">
                <StarRating value={row.rating} label={t("stars", { count: row.rating })} />
                {row.comment ? <p className="line-clamp-3 text-sm text-ink-button">{row.comment}</p> : <span className="text-xs text-ink-3">{t("noComment")}</span>}
              </div>
            ),
          },
          {
            header: t("cols.course"),
            cell: (row) => (
              <Link href={`/courses/${row.courseId}`} className="text-sm text-ink hover:text-brand" target="_blank">
                {row.courseTitle}
              </Link>
            ),
          },
          {
            header: t("cols.student"),
            cell: (row) => (
              <div className="text-sm">
                <p className="text-ink">{row.studentName}</p>
                <p className="text-xs text-ink-3" dir="ltr">{row.studentEmail}</p>
              </div>
            ),
          },
          { header: t("cols.date"), cell: (row) => <span className="whitespace-nowrap text-sm">{formatDateTime(row.createdAt, locale)}</span> },
          { header: t("cols.status"), cell: (row) => (row.hidden ? <Badge tone="gray">{t("hiddenFilter")}</Badge> : <Badge tone="green">{t("visible")}</Badge>) },
        ]}
        actions={(row) => (
          <Button size="sm" variant="outline" onClick={() => void toggle(row)} disabled={busyId === row.id}>
            {busyId === row.id ? <Loader2 className="animate-spin" /> : row.hidden ? <Eye /> : <EyeOff />}
            {row.hidden ? t("show") : t("hide")}
          </Button>
        )}
      />
    </>
  )
}
