"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Check, Copy, KeyRound, Loader2 } from "lucide-react"

import { CourseSelect } from "@/components/admin/CourseSelect"
import { DataTable, useServerTable } from "@/components/admin/DataTable"
import { Badge, ConfirmDialog, FormField, PageHeader, formatDate } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { EnrollmentCodeRow, downloadCsv, enrollmentCodesApi } from "@/lib/admin-api"

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      size="sm"
      variant="outline"
      title={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
      }}
    >
      {copied ? <Check /> : <Copy />}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

export default function AdminEnrollmentCodesPage() {
  const t = useTranslations("admin.codes")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()

  const [courseFilter, setCourseFilter] = React.useState<number | "">("")
  const [generateOpen, setGenerateOpen] = React.useState(false)
  const [courseId, setCourseId] = React.useState<number | "">("")
  const [quantity, setQuantity] = React.useState("10")
  const [usageLimit, setUsageLimit] = React.useState("1")
  const [expiresAt, setExpiresAt] = React.useState("")
  const [generating, setGenerating] = React.useState(false)
  const [generated, setGenerated] = React.useState<EnrollmentCodeRow[]>([])
  const [toDeactivate, setToDeactivate] = React.useState<EnrollmentCodeRow | null>(null)
  const [busy, setBusy] = React.useState(false)

  const fetchPage = React.useCallback(
    (page: number) => enrollmentCodesApi.list({ courseId: courseFilter, page, size: 50 }),
    [courseFilter],
  )
  const table = useServerTable(fetchPage)

  const generate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (courseId === "") return
    setGenerating(true)
    try {
      const codes = await enrollmentCodesApi.generate({
        courseId,
        quantity: Number(quantity),
        usageLimit: Number(usageLimit),
        expiresAt: expiresAt ? `${expiresAt}T23:59:59` : undefined,
      })
      setGenerated(codes)
      toast({ title: t("generated", { count: codes.length }) })
      table.reload()
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const deactivate = async () => {
    if (!toDeactivate) return
    setBusy(true)
    try {
      await enrollmentCodesApi.deactivate(toDeactivate.id)
      table.updateRow((row) => row.id === toDeactivate.id, { ...toDeactivate, active: false, usable: false })
      toast({ title: t("deactivated") })
      setToDeactivate(null)
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const csvColumns = [
    { header: "code", value: (r: EnrollmentCodeRow) => r.code },
    { header: "course", value: (r: EnrollmentCodeRow) => r.courseTitle },
    { header: "usage_limit", value: (r: EnrollmentCodeRow) => (r.usageLimit === -1 ? "unlimited" : r.usageLimit) },
    { header: "used", value: (r: EnrollmentCodeRow) => r.usedCount },
    { header: "expires_at", value: (r: EnrollmentCodeRow) => r.expiresAt ?? "" },
    { header: "usable", value: (r: EnrollmentCodeRow) => r.usable },
  ]

  const closeGenerate = (open: boolean) => {
    setGenerateOpen(open)
    if (!open) setGenerated([])
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setGenerateOpen(true)}>
            <KeyRound />
            {t("generate")}
          </Button>
        }
      />

      <DataTable
        table={table}
        getRowKey={(row) => row.id}
        emptyMessage={t("empty")}
        onExport={async () => downloadCsv("enrollment-codes.csv", table.rows, csvColumns)}
        toolbar={<CourseSelect value={courseFilter} allLabel={tc("allCourses")} onChange={setCourseFilter} className="max-w-[18rem]" />}
        columns={[
          {
            header: t("code"),
            cell: (row) => (
              <code className="rounded bg-subtle px-2 py-1 font-mono text-sm tracking-wider text-ink" dir="ltr">
                {row.code}
              </code>
            ),
          },
          { header: t("course"), cell: (row) => row.courseTitle },
          {
            header: t("uses"),
            cell: (row) => (
              <span dir="ltr">
                {row.usedCount} / {row.usageLimit === -1 ? "∞" : row.usageLimit}
              </span>
            ),
          },
          { header: t("expires"), cell: (row) => (row.expiresAt ? formatDate(row.expiresAt, locale) : t("never")) },
          {
            header: t("status"),
            cell: (row) =>
              row.usable ? (
                <Badge tone="green">{t("usable")}</Badge>
              ) : row.active ? (
                <Badge tone="amber">{t("usedUpOrExpired")}</Badge>
              ) : (
                <Badge tone="gray">{t("inactive")}</Badge>
              ),
          },
        ]}
        actions={(row) => (
          <>
            <CopyButton value={row.code} label={t("copy")} />
            {row.active ? (
              <Button size="sm" variant="outline" className="text-danger" onClick={() => setToDeactivate(row)}>
                {t("deactivate")}
              </Button>
            ) : null}
          </>
        )}
      />

      <Dialog open={generateOpen} onOpenChange={closeGenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generateTitle")}</DialogTitle>
            <p className="text-sm text-ink-2">{t("generateHint")}</p>
          </DialogHeader>
          {generated.length > 0 ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto rounded-lg border border-line-strong bg-paper p-3">
                <ul className="grid grid-cols-1 gap-1 font-mono text-sm sm:grid-cols-2" dir="ltr">
                  {generated.map((c) => (
                    <li key={c.id}>{c.code}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <CopyButton value={generated.map((c) => c.code).join("\n")} label={t("copyAll")} />
                <Button variant="outline" onClick={() => downloadCsv("enrollment-codes.csv", generated, csvColumns)}>
                  {t("downloadCsv")}
                </Button>
                <Button onClick={() => closeGenerate(false)}>{t("done")}</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void generate(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label={t("course")} htmlFor="gc-course">
                  <CourseSelect id="gc-course" required value={courseId} onChange={setCourseId} className="w-full" />
                </FormField>
              </div>
              <FormField label={t("quantity")} htmlFor="gc-qty">
                <Input id="gc-qty" type="number" min={1} max={500} required dir="ltr" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </FormField>
              <FormField label={t("usesPerCode")} htmlFor="gc-uses" hint={t("usesHint")}>
                <Input id="gc-uses" type="number" min={-1} required dir="ltr" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label={t("expiresOn")} htmlFor="gc-exp" hint={t("expiresHint")}>
                  <Input id="gc-exp" type="date" dir="ltr" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </FormField>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => closeGenerate(false)}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={generating || courseId === ""}>
                  {generating ? <Loader2 className="animate-spin" /> : null}
                  {t("generate")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDeactivate !== null}
        onOpenChange={(open) => !open && setToDeactivate(null)}
        title={t("confirmDeactivateTitle")}
        description={toDeactivate ? t("confirmDeactivate", { code: toDeactivate.code }) : undefined}
        confirmLabel={t("deactivate")}
        cancelLabel={tc("cancel")}
        destructive
        busy={busy}
        onConfirm={() => void deactivate()}
      />
    </>
  )
}
