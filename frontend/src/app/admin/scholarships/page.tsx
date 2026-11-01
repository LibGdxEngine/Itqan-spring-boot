"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Check, Eye, Loader2, X } from "lucide-react"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { CourseSelect } from "@/components/admin/CourseSelect"
import { Badge, BadgeTone, FormField, PageHeader, Select, StatCard, formatDateTime, formatMoney } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { useSiteCurrency } from "@/lib/use-site-currency"
import {
  adminScholarshipsApi,
  type AdminScholarshipRow,
  type FundingSource,
  type ScholarshipFundSummary,
  type ScholarshipStatus,
} from "@/lib/scholarships-api"

const STATUS_TONE: Record<ScholarshipStatus, BadgeTone> = {
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  WITHDRAWN: "gray",
}

type Decision = { row: AdminScholarshipRow; mode: "view" | "approve" | "reject" }

export default function AdminScholarshipsPage() {
  const t = useTranslations("admin.scholarships")
  const tc = useTranslations("admin.common")
  const ts = useTranslations("scholarships.status")
  const locale = useLocale()
  const currency = useSiteCurrency()
  const { toast } = useToast()

  const [filters, setFilters] = React.useState<{ q: string; status: ScholarshipStatus | ""; courseId: number | "" }>({
    q: "",
    status: "PENDING",
    courseId: "",
  })
  const [fund, setFund] = React.useState<ScholarshipFundSummary | null>(null)
  const [decision, setDecision] = React.useState<Decision | null>(null)
  const [source, setSource] = React.useState<FundingSource>("FUND")
  const [note, setNote] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const loadFund = React.useCallback(() => {
    adminScholarshipsApi.fund().then(setFund).catch(() => setFund(null))
  }, [])
  React.useEffect(loadFund, [loadFund])

  const fetchPage = React.useCallback(
    (page: number) => adminScholarshipsApi.search({ ...filters, page, size: 20 }),
    [filters],
  )
  const table = useServerTable(fetchPage)
  const money = (value: number | null | undefined) => formatMoney(value ?? 0, currency, locale)

  const open = (row: AdminScholarshipRow, mode: Decision["mode"]) => {
    const price = row.coursePrice ?? 0
    setSource(fund && fund.balance >= price ? "FUND" : "ACADEMY")
    setNote("")
    setDecision({ row, mode })
  }

  const fundCovers = (row: AdminScholarshipRow) => !!fund && fund.balance >= (row.coursePrice ?? 0)

  const decide = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!decision) return
    setSaving(true)
    try {
      const updated =
        decision.mode === "approve"
          ? await adminScholarshipsApi.approve(decision.row.id, source, note.trim() || undefined)
          : await adminScholarshipsApi.reject(decision.row.id, note.trim() || undefined)
      table.updateRow((r) => r.id === updated.id, updated)
      toast({ title: decision.mode === "approve" ? t("approved") : t("rejected") })
      setDecision(null)
      loadFund()
    } catch (error) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  const row = decision?.row

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/admin/donations" className="text-sm font-medium text-brand hover:underline">
            {t("manageDonations")}
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("fundBalance")} value={fund ? money(fund.balance) : "—"} hint={fund ? t("fundHint", { received: money(fund.received), used: money(fund.used) }) : undefined} />
        <StatCard label={t("pendingCount")} value={fund?.pendingApplications ?? "—"} />
        <StatCard label={t("approvedCount")} value={fund?.approvedApplications ?? "—"} />
      </div>

      <DataTable
        table={table}
        getRowKey={(r) => r.id}
        emptyMessage={t("empty")}
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <CourseSelect
              value={filters.courseId}
              onChange={(courseId) => setFilters((f) => ({ ...f, courseId }))}
              allLabel={tc("allCourses")}
            />
            <Select
              aria-label={t("cols.status")}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as ScholarshipStatus | "" }))}
            >
              <option value="">{t("allStatuses")}</option>
              {(["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"] as const).map((s) => (
                <option key={s} value={s}>
                  {ts(s)}
                </option>
              ))}
            </Select>
          </>
        }
        columns={[
          {
            header: t("cols.student"),
            cell: (r) => (
              <div className="text-sm">
                <p className="text-ink">{r.studentName || r.studentEmail}</p>
                <p className="text-xs text-ink-3" dir="ltr">{r.studentEmail}</p>
              </div>
            ),
          },
          {
            header: t("cols.course"),
            cell: (r) => (
              <div className="text-sm">
                <p className="text-ink">{r.courseTitle}</p>
                <p className="text-xs text-ink-3" dir="ltr">{money(r.coursePrice)}</p>
              </div>
            ),
          },
          {
            header: t("cols.reason"),
            cell: (r) => <p className="line-clamp-2 max-w-xs text-sm text-ink-button">{r.reason}</p>,
          },
          { header: t("cols.date"), cell: (r) => <span className="whitespace-nowrap text-sm">{formatDateTime(r.createdAt, locale)}</span> },
          {
            header: t("cols.status"),
            cell: (r) => (
              <div className="space-y-1">
                <Badge tone={STATUS_TONE[r.status]}>{ts(r.status)}</Badge>
                {r.fundingSource ? <p className="text-xs text-ink-3">{t(`source.${r.fundingSource}`)}</p> : null}
              </div>
            ),
          },
        ]}
        actions={(r) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => open(r, "view")}>
              <Eye />
              {t("view")}
            </Button>
            {r.status === "PENDING" ? (
              <>
                <Button size="sm" onClick={() => open(r, "approve")}>
                  <Check />
                  {t("approve")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => open(r, "reject")}>
                  <X />
                  {t("reject")}
                </Button>
              </>
            ) : null}
          </div>
        )}
      />

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {row ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {decision?.mode === "approve" ? t("approveTitle") : decision?.mode === "reject" ? t("rejectTitle") : t("detailsTitle")}
                </DialogTitle>
                <p className="text-sm text-ink-2">
                  {row.studentName || row.studentEmail} · {row.courseTitle} · <span dir="ltr">{money(row.coursePrice)}</span>
                </p>
              </DialogHeader>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-ink">{t("cols.reason")}</dt>
                  <dd className="whitespace-pre-line text-ink-2">{row.reason}</dd>
                </div>
                {row.circumstances ? (
                  <div>
                    <dt className="font-medium text-ink">{t("circumstances")}</dt>
                    <dd className="whitespace-pre-line text-ink-2">{row.circumstances}</dd>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-x-6 gap-y-1">
                  <span className="text-ink-2">
                    {t("email")}: <span dir="ltr">{row.studentEmail}</span>
                  </span>
                  {row.phone ? (
                    <span className="text-ink-2">
                      {t("phone")}: <span dir="ltr">{row.phone}</span>
                    </span>
                  ) : null}
                </div>
                {row.adminNote ? (
                  <div>
                    <dt className="font-medium text-ink">{t("note")}</dt>
                    <dd className="text-ink-2">{row.adminNote}</dd>
                  </div>
                ) : null}
              </dl>

              {decision?.mode === "view" ? null : (
                <form onSubmit={(e) => void decide(e)} className="space-y-4 border-t border-line pt-4">
                  {decision?.mode === "approve" ? (
                    <fieldset className="space-y-2">
                      <legend className="mb-1 text-sm font-medium text-ink">{t("fundingSource")}</legend>
                      <label className={`flex items-start gap-2 text-sm ${fundCovers(row) ? "" : "opacity-60"}`}>
                        <input
                          type="radio"
                          name="source"
                          value="FUND"
                          className="mt-1"
                          disabled={!fundCovers(row)}
                          checked={source === "FUND"}
                          onChange={() => setSource("FUND")}
                        />
                        <span>
                          <span className="block text-ink">{t("source.FUND")}</span>
                          <span className="block text-xs text-ink-3">
                            {fundCovers(row)
                              ? t("fundAvailable", { balance: money(fund?.balance) })
                              : t("fundShort", { balance: money(fund?.balance) })}
                          </span>
                        </span>
                      </label>
                      <label className="flex items-start gap-2 text-sm">
                        <input type="radio" name="source" value="ACADEMY" className="mt-1" checked={source === "ACADEMY"} onChange={() => setSource("ACADEMY")} />
                        <span>
                          <span className="block text-ink">{t("source.ACADEMY")}</span>
                          <span className="block text-xs text-ink-3">{t("academyHint")}</span>
                        </span>
                      </label>
                    </fieldset>
                  ) : null}
                  <FormField
                    label={decision?.mode === "approve" ? t("noteOptional") : t("rejectNote")}
                    htmlFor="sch-note"
                    hint={t("noteHint")}
                  >
                    <Textarea id="sch-note" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
                  </FormField>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDecision(null)}>
                      {tc("cancel")}
                    </Button>
                    <Button
                      type="submit"
                      variant={decision?.mode === "reject" ? "destructive" : "default"}
                      disabled={saving || (decision?.mode === "approve" && source === "FUND" && !fundCovers(row))}
                    >
                      {saving ? <Loader2 className="animate-spin" /> : null}
                      {decision?.mode === "approve" ? t("confirmApprove") : t("confirmReject")}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
