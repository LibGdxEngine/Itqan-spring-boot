"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Trash2, UserPlus } from "lucide-react"

import { CourseSelect } from "@/components/admin/CourseSelect"
import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, BadgeTone, ConfirmDialog, FormField, PageHeader, Select, formatDate } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import {
  AdminEnrollmentRow,
  EnrollmentFilters,
  EnrollmentStatus,
  adminEnrollmentsApi,
  downloadCsv,
} from "@/lib/admin-api"

const STATUS_TONE: Record<EnrollmentStatus, BadgeTone> = { ACTIVE: "green", COMPLETED: "accent", DROPPED: "gray" }

export default function AdminEnrollmentsPage() {
  const t = useTranslations("admin.enrollments")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()

  const [filters, setFilters] = React.useState<EnrollmentFilters>({ q: "", courseId: "", status: "" })
  const [grantOpen, setGrantOpen] = React.useState(false)
  const [grantEmail, setGrantEmail] = React.useState("")
  const [grantCourse, setGrantCourse] = React.useState<number | "">("")
  const [granting, setGranting] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<AdminEnrollmentRow | null>(null)
  const [busy, setBusy] = React.useState(false)

  const fetchPage = React.useCallback(
    (page: number) => adminEnrollmentsApi.search({ ...filters, page, size: 20 }),
    [filters],
  )
  const table = useServerTable(fetchPage)

  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") setGrantOpen(true)
  }, [])

  const grant = async (event: React.FormEvent) => {
    event.preventDefault()
    if (grantCourse === "") return
    setGranting(true)
    try {
      await adminEnrollmentsApi.grant(grantEmail.trim(), grantCourse)
      toast({ title: t("granted") })
      setGrantOpen(false)
      setGrantEmail("")
      setGrantCourse("")
      table.reload()
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setGranting(false)
    }
  }

  const changeStatus = async (row: AdminEnrollmentRow, status: EnrollmentStatus) => {
    try {
      const updated = await adminEnrollmentsApi.setStatus(row.id, status)
      table.updateRow((r) => r.id === updated.id, updated)
      toast({ title: t("statusChanged") })
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    }
  }

  const remove = async () => {
    if (!toDelete) return
    setBusy(true)
    try {
      await adminEnrollmentsApi.remove(toDelete.id)
      toast({ title: t("deleted") })
      setToDelete(null)
      table.reload()
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = async () => {
    const rows = await adminEnrollmentsApi.export(filters)
    downloadCsv("enrollments.csv", rows, [
      { header: "id", value: (r) => r.id },
      { header: "student", value: (r) => r.studentName },
      { header: "email", value: (r) => r.studentEmail },
      { header: "course", value: (r) => r.courseTitle },
      { header: "status", value: (r) => r.status },
      { header: "progress", value: (r) => r.progress },
      { header: "enrolled_at", value: (r) => r.enrolledAt },
      { header: "last_accessed_at", value: (r) => r.lastAccessedAt ?? "" },
    ])
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setGrantOpen(true)}>
            <UserPlus />
            {t("grant")}
          </Button>
        }
      />

      <DataTable
        table={table}
        getRowKey={(row) => row.id}
        onExport={exportCsv}
        emptyMessage={t("empty")}
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <CourseSelect
              value={filters.courseId ?? ""}
              allLabel={tc("allCourses")}
              onChange={(courseId) => setFilters((f) => ({ ...f, courseId }))}
              className="max-w-[16rem]"
            />
            <Select
              aria-label={t("status")}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as EnrollmentFilters["status"] }))}
            >
              <option value="">{t("allStatuses")}</option>
              {(["ACTIVE", "COMPLETED", "DROPPED"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.${s}`)}
                </option>
              ))}
            </Select>
          </>
        }
        columns={[
          {
            header: t("student"),
            cell: (row) => (
              <div>
                <p className="font-medium text-ink">{row.studentName}</p>
                <p className="text-xs text-ink-3" dir="ltr">
                  {row.studentEmail}
                </p>
              </div>
            ),
          },
          { header: t("course"), cell: (row) => row.courseTitle },
          {
            header: t("status"),
            cell: (row) => <Badge tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</Badge>,
          },
          {
            header: t("progress"),
            cell: (row) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-subtle">
                  <div className="h-full bg-brand" style={{ width: `${row.progress ?? 0}%` }} />
                </div>
                <span className="text-xs" dir="ltr">
                  {row.progress ?? 0}%
                </span>
              </div>
            ),
          },
          { header: t("enrolled"), cell: (row) => formatDate(row.enrolledAt, locale) },
        ]}
        actions={(row) => (
          <>
            <Select
              aria-label={t("changeStatus")}
              value={row.status}
              onChange={(e) => void changeStatus(row, e.target.value as EnrollmentStatus)}
              className="h-9"
            >
              {(["ACTIVE", "COMPLETED", "DROPPED"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.${s}`)}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="outline" className="text-danger" onClick={() => setToDelete(row)} title={tc("delete")}>
              <Trash2 />
              <span className="sr-only">{tc("delete")}</span>
            </Button>
          </>
        )}
      />

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("grantTitle")}</DialogTitle>
            <p className="text-sm text-ink-2">{t("grantHint")}</p>
          </DialogHeader>
          <form onSubmit={(e) => void grant(e)} className="space-y-4">
            <FormField label={t("studentEmail")} htmlFor="grant-email">
              <Input
                id="grant-email"
                type="email"
                dir="ltr"
                required
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
              />
            </FormField>
            <FormField label={t("course")} htmlFor="grant-course">
              <CourseSelect id="grant-course" required value={grantCourse} onChange={setGrantCourse} className="w-full" />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setGrantOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={granting || grantCourse === ""}>
                {granting ? <Loader2 className="animate-spin" /> : null}
                {t("grant")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("confirmDeleteTitle")}
        description={toDelete ? t("confirmDelete", { name: toDelete.studentName, course: toDelete.courseTitle }) : undefined}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        destructive
        busy={busy}
        onConfirm={() => void remove()}
      />
    </>
  )
}
