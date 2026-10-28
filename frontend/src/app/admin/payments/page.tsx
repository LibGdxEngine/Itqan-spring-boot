"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Plus, Undo2 } from "lucide-react"

import { CourseSelect, useCourseOptions } from "@/components/admin/CourseSelect"
import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, BadgeTone, ConfirmDialog, FormField, PageHeader, Select, formatDateTime, formatMoney } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { AdminPaymentRow, PaymentFilters, PaymentStatus, adminPaymentsApi, downloadCsv, settingsApi } from "@/lib/admin-api"

const STATUSES: PaymentStatus[] = ["COMPLETED", "PENDING", "REFUNDED", "FAILED", "CANCELLED"]
const STATUS_TONE: Record<PaymentStatus, BadgeTone> = {
  COMPLETED: "green",
  PENDING: "amber",
  REFUNDED: "accent",
  FAILED: "red",
  CANCELLED: "gray",
}
const METHODS = ["VODAFONE_CASH", "INSTAPAY", "CASH", "BANK_TRANSFER", "OTHER"] as const

interface ManualForm {
  studentEmail: string
  courseId: number | ""
  amount: string
  currency: string
  method: (typeof METHODS)[number]
  reference: string
  notes: string
}

const emptyForm: ManualForm = {
  studentEmail: "",
  courseId: "",
  amount: "",
  currency: "EGP",
  method: "VODAFONE_CASH",
  reference: "",
  notes: "",
}

export default function AdminPaymentsPage() {
  const t = useTranslations("admin.payments")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()
  const courses = useCourseOptions()

  const [filters, setFilters] = React.useState<PaymentFilters>({ q: "", status: "", courseId: "", gateway: "" })
  const [manualOpen, setManualOpen] = React.useState(false)
  const [form, setForm] = React.useState<ManualForm>(emptyForm)
  const [saving, setSaving] = React.useState(false)
  const [refunding, setRefunding] = React.useState<AdminPaymentRow | null>(null)
  const [refundReason, setRefundReason] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const fetchPage = React.useCallback((page: number) => adminPaymentsApi.search({ ...filters, page, size: 20 }), [filters])
  const table = useServerTable(fetchPage)

  React.useEffect(() => {
    settingsApi
      .get()
      .then((s) => s.defaultCurrency && setForm((f) => ({ ...f, currency: s.defaultCurrency })))
      .catch(() => undefined)
    if (new URLSearchParams(window.location.search).get("new") === "1") setManualOpen(true)
  }, [])

  const update = <K extends keyof ManualForm>(key: K, value: ManualForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  const pickCourse = (courseId: number | "") => {
    const course = courses.find((c) => c.id === courseId)
    setForm((f) => ({ ...f, courseId, amount: course && f.amount === "" ? String(course.price) : f.amount }))
  }

  const recordManual = async (event: React.FormEvent) => {
    event.preventDefault()
    if (form.courseId === "") return
    setSaving(true)
    try {
      await adminPaymentsApi.recordManual({
        studentEmail: form.studentEmail.trim(),
        courseId: form.courseId,
        amount: Number(form.amount),
        currency: form.currency.trim().toUpperCase(),
        method: form.method,
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      toast({ title: t("recorded"), description: t("recordedHint") })
      setManualOpen(false)
      setForm((f) => ({ ...emptyForm, currency: f.currency }))
      table.reload()
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const refund = async () => {
    if (!refunding) return
    setBusy(true)
    try {
      const updated = await adminPaymentsApi.refund(refunding.id, refundReason.trim() || undefined)
      table.updateRow((row) => row.id === updated.id, updated)
      toast({ title: t("refunded") })
      setRefunding(null)
      setRefundReason("")
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = async () => {
    const rows = await adminPaymentsApi.export(filters)
    downloadCsv("payments.csv", rows, [
      { header: "id", value: (r) => r.id },
      { header: "date", value: (r) => r.createdAt },
      { header: "student", value: (r) => r.studentName },
      { header: "email", value: (r) => r.studentEmail },
      { header: "course", value: (r) => r.courseTitle },
      { header: "amount", value: (r) => r.amount },
      { header: "currency", value: (r) => r.currency },
      { header: "status", value: (r) => r.status },
      { header: "gateway", value: (r) => r.gateway ?? "" },
      { header: "method", value: (r) => r.method ?? "" },
      { header: "reference", value: (r) => r.transactionId ?? "" },
      { header: "coupon", value: (r) => r.couponCode ?? "" },
      { header: "notes", value: (r) => r.notes ?? "" },
    ])
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setManualOpen(true)}>
            <Plus />
            {t("recordManual")}
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
            <Select
              aria-label={t("status")}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as PaymentFilters["status"] }))}
            >
              <option value="">{t("allStatuses")}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.${s}`)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("gateway")}
              value={filters.gateway}
              onChange={(e) => setFilters((f) => ({ ...f, gateway: e.target.value }))}
            >
              <option value="">{t("allGateways")}</option>
              <option value="STRIPE">Stripe</option>
              <option value="MANUAL">{t("gateways.MANUAL")}</option>
            </Select>
            <CourseSelect
              value={filters.courseId ?? ""}
              allLabel={tc("allCourses")}
              onChange={(courseId) => setFilters((f) => ({ ...f, courseId }))}
              className="max-w-[14rem]"
            />
          </>
        }
        columns={[
          { header: t("date"), cell: (row) => formatDateTime(row.createdAt, locale) },
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
            header: t("amount"),
            alignEnd: true,
            cell: (row) => (
              <div>
                <p className="font-medium text-ink" dir="ltr">
                  {formatMoney(row.amount, row.currency, locale)}
                </p>
                {row.couponCode ? <p className="text-xs text-ink-3">{row.couponCode}</p> : null}
              </div>
            ),
          },
          { header: t("status"), cell: (row) => <Badge tone={STATUS_TONE[row.status]}>{t(`statuses.${row.status}`)}</Badge> },
          {
            header: t("method"),
            cell: (row) => (
              <div className="text-xs">
                <p>{row.gateway === "MANUAL" ? t("gateways.MANUAL") : row.gateway ?? "—"}</p>
                {row.method ? <p className="text-ink-3">{t.has(`methods.${row.method}`) ? t(`methods.${row.method}`) : row.method}</p> : null}
                {row.transactionId ? (
                  <p className="max-w-[10rem] truncate text-ink-3" dir="ltr" title={row.transactionId}>
                    {row.transactionId}
                  </p>
                ) : null}
              </div>
            ),
          },
        ]}
        actions={(row) =>
          row.status === "COMPLETED" ? (
            <Button size="sm" variant="outline" onClick={() => setRefunding(row)}>
              <Undo2 className="rtl:-scale-x-100" />
              {t("refund")}
            </Button>
          ) : null
        }
      />

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("manualTitle")}</DialogTitle>
            <p className="text-sm text-ink-2">{t("manualHint")}</p>
          </DialogHeader>
          <form onSubmit={(e) => void recordManual(e)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormField label={t("studentEmail")} htmlFor="mp-email">
                <Input
                  id="mp-email"
                  type="email"
                  dir="ltr"
                  required
                  value={form.studentEmail}
                  onChange={(e) => update("studentEmail", e.target.value)}
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label={t("course")} htmlFor="mp-course">
                <CourseSelect id="mp-course" required value={form.courseId} onChange={pickCourse} className="w-full" />
              </FormField>
            </div>
            <FormField label={t("amount")} htmlFor="mp-amount">
              <Input
                id="mp-amount"
                type="number"
                min="0"
                step="0.01"
                dir="ltr"
                required
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
              />
            </FormField>
            <FormField label={t("currency")} htmlFor="mp-currency">
              <Input
                id="mp-currency"
                dir="ltr"
                required
                maxLength={3}
                minLength={3}
                value={form.currency}
                onChange={(e) => update("currency", e.target.value.toUpperCase())}
              />
            </FormField>
            <FormField label={t("method")} htmlFor="mp-method">
              <Select
                id="mp-method"
                className="w-full"
                value={form.method}
                onChange={(e) => update("method", e.target.value as ManualForm["method"])}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {t(`methods.${m}`)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("reference")} htmlFor="mp-ref" hint={t("referenceHint")}>
              <Input id="mp-ref" dir="ltr" value={form.reference} onChange={(e) => update("reference", e.target.value)} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label={t("notes")} htmlFor="mp-notes">
                <Textarea id="mp-notes" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={saving || form.courseId === ""}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {t("recordAndEnroll")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={refunding !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRefunding(null)
            setRefundReason("")
          }
        }}
        title={t("refundTitle")}
        description={
          refunding
            ? refunding.gateway === "STRIPE"
              ? t("refundStripe", { amount: formatMoney(refunding.amount, refunding.currency, locale) })
              : t("refundManual", { amount: formatMoney(refunding.amount, refunding.currency, locale) })
            : undefined
        }
        confirmLabel={t("refund")}
        cancelLabel={tc("cancel")}
        destructive
        busy={busy}
        onConfirm={() => void refund()}
      >
        <FormField label={t("refundReason")} htmlFor="refund-reason">
          <Textarea id="refund-reason" rows={2} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </>
  )
}
