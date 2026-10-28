"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, ConfirmDialog, PageHeader, Select, formatDate } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { AdminCourseRow, CourseFilters, adminCoursesApi } from "@/lib/admin-api"

type PendingAction = { kind: "toggle" | "duplicate" | "delete"; course: AdminCourseRow }

export default function AdminCoursesPage() {
  const t = useTranslations("admin.coursesPage")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()

  const [filters, setFilters] = React.useState<CourseFilters>({ q: "", active: "" })
  const [pending, setPending] = React.useState<PendingAction | null>(null)
  const [busy, setBusy] = React.useState(false)

  const fetchPage = React.useCallback((page: number) => adminCoursesApi.search({ ...filters, page, size: 20 }), [filters])
  const table = useServerTable(fetchPage)

  const runPending = async () => {
    if (!pending) return
    setBusy(true)
    const { kind, course } = pending
    try {
      if (kind === "toggle") {
        const updated = await adminCoursesApi.setActive(course.id, !course.active)
        table.updateRow((row) => row.id === updated.id, updated)
        toast({ title: updated.active ? t("published") : t("unpublished") })
      } else if (kind === "duplicate") {
        await adminCoursesApi.duplicate(course.id)
        toast({ title: t("duplicated") })
        table.reload()
      } else {
        await adminCoursesApi.remove(course.id)
        toast({ title: t("deleted") })
        table.reload()
      }
      setPending(null)
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const dialogCopy = pending
    ? {
        toggle: {
          title: pending.course.active ? t("confirmUnpublishTitle") : t("confirmPublishTitle"),
          description: pending.course.active ? t("confirmUnpublish") : t("confirmPublish"),
          confirm: pending.course.active ? t("unpublish") : t("publish"),
          destructive: false,
        },
        duplicate: {
          title: t("confirmDuplicateTitle"),
          description: t("confirmDuplicate"),
          confirm: t("duplicate"),
          destructive: false,
        },
        delete: {
          title: t("confirmDeleteTitle"),
          description: t("confirmDelete", { count: pending.course.enrollmentCount }),
          confirm: tc("delete"),
          destructive: true,
        },
      }[pending.kind]
    : null

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
            <Select
              aria-label={t("status")}
              value={filters.active}
              onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value as CourseFilters["active"] }))}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="true">{t("publishedLabel")}</option>
              <option value="false">{t("draftLabel")}</option>
            </Select>
          </>
        }
        columns={[
          {
            header: t("course"),
            cell: (row) => (
              <div className="flex items-center gap-3">
                {row.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.thumbnailUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-10 w-16 shrink-0 rounded bg-subtle" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{row.title}</p>
                  <p className="text-xs text-ink-3">{row.instructor}</p>
                </div>
              </div>
            ),
          },
          {
            header: t("status"),
            cell: (row) =>
              row.active ? <Badge tone="green">{t("publishedLabel")}</Badge> : <Badge tone="gray">{t("draftLabel")}</Badge>,
          },
          { header: t("price"), cell: (row) => (row.price > 0 ? row.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-US") : t("free")), alignEnd: true },
          { header: t("content"), cell: (row) => t("contentCount", { modules: row.moduleCount, lessons: row.lessonCount }) },
          { header: t("students"), cell: (row) => row.enrollmentCount, alignEnd: true },
          { header: t("created"), cell: (row) => formatDate(row.createdAt, locale) },
        ]}
        actions={(row) => (
          <>
            <Button asChild size="sm" variant="outline" title={t("editContent")}>
              <Link href={`/instructor/courses/${row.id}/lessons`}>
                <Pencil />
                <span className="sr-only md:not-sr-only">{t("editContent")}</span>
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" title={t("view")}>
              <Link href={`/courses/${row.id}`} target="_blank">
                <Eye />
                <span className="sr-only">{t("view")}</span>
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              title={row.active ? t("unpublish") : t("publish")}
              onClick={() => setPending({ kind: "toggle", course: row })}
            >
              {row.active ? <EyeOff /> : <Eye />}
              <span className="sr-only">{row.active ? t("unpublish") : t("publish")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              title={t("duplicate")}
              onClick={() => setPending({ kind: "duplicate", course: row })}
            >
              <Copy />
              <span className="sr-only">{t("duplicate")}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-danger"
              title={tc("delete")}
              onClick={() => setPending({ kind: "delete", course: row })}
            >
              <Trash2 />
              <span className="sr-only">{tc("delete")}</span>
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={dialogCopy?.title}
        description={pending ? <>{pending.course.title} — {dialogCopy?.description}</> : undefined}
        confirmLabel={dialogCopy?.confirm}
        cancelLabel={tc("cancel")}
        destructive={dialogCopy?.destructive}
        busy={busy}
        onConfirm={() => void runPending()}
      />
    </>
  )
}
