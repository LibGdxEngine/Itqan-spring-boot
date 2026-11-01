"use client"

import * as React from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Loader2, Plus } from "lucide-react"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, BadgeTone, FormField, PageHeader, Select, StatCard, formatDateTime, formatMoney } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getErrorMessage } from "@/lib/api-axios"
import { useSiteCurrency } from "@/lib/use-site-currency"
import {
  adminScholarshipsApi,
  type DonationStatus,
  type ScholarshipFundSummary,
} from "@/lib/scholarships-api"

const STATUS_TONE: Record<DonationStatus, BadgeTone> = {
  PENDING: "amber",
  COMPLETED: "green",
  FAILED: "red",
  REFUNDED: "gray",
}

const METHODS = ["VODAFONE_CASH", "INSTAPAY", "BANK_TRANSFER", "CASH", "OTHER"] as const

const EMPTY_FORM = { amount: "", method: "INSTAPAY", donorName: "", donorEmail: "", reference: "", message: "" }

export default function AdminDonationsPage() {
  const t = useTranslations("admin.donations")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const currency = useSiteCurrency()
  const { toast } = useToast()

  const [filters, setFilters] = React.useState<{ q: string; status: DonationStatus | ""; gateway: string }>({
    q: "",
    status: "",
    gateway: "",
  })
  const [fund, setFund] = React.useState<ScholarshipFundSummary | null>(null)
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState(EMPTY_FORM)
  const [saving, setSaving] = React.useState(false)

  const loadFund = React.useCallback(() => {
    adminScholarshipsApi.fund().then(setFund).catch(() => setFund(null))
  }, [])
  React.useEffect(loadFund, [loadFund])

  const fetchPage = React.useCallback(
    (page: number) => adminScholarshipsApi.donations({ ...filters, page, size: 20 }),
    [filters],
  )
  const table = useServerTable(fetchPage)
  const money = (value: number | null | undefined, cur = currency) => formatMoney(value ?? 0, cur, locale)

  const record = async (event: React.FormEvent) => {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return
    setSaving(true)
    try {
      await adminScholarshipsApi.recordDonation({
        amount,
        currency,
        method: form.method,
        donorName: form.donorName.trim() || undefined,
        donorEmail: form.donorEmail.trim() || undefined,
        reference: form.reference.trim() || undefined,
        message: form.message.trim() || undefined,
      })
      toast({ title: t("recorded") })
      setOpen(false)
      setForm(EMPTY_FORM)
      table.reload()
      loadFund()
    } catch (error) {
      toast({ variant: "destructive", title: tc("failed"), description: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            {t("record")}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("received")} value={fund ? money(fund.received) : "—"} hint={fund ? t("count", { count: fund.donationsCount }) : undefined} />
        <StatCard label={t("used")} value={fund ? money(fund.used) : "—"} hint={fund ? t("approvedHint", { count: fund.approvedApplications }) : undefined} />
        <StatCard label={t("balance")} value={fund ? money(fund.balance) : "—"} hint={<Link href="/admin/scholarships" className="text-brand hover:underline">{t("toRequests")}</Link>} />
      </div>

      <DataTable
        table={table}
        getRowKey={(r) => r.id}
        emptyMessage={t("empty")}
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <Select aria-label={t("cols.status")} value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as DonationStatus | "" }))}>
              <option value="">{t("allStatuses")}</option>
              {(["COMPLETED", "PENDING", "FAILED", "REFUNDED"] as const).map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </Select>
            <Select aria-label={t("cols.method")} value={filters.gateway} onChange={(e) => setFilters((f) => ({ ...f, gateway: e.target.value }))}>
              <option value="">{t("allGateways")}</option>
              <option value="PAYMOB">{t("gateway.PAYMOB")}</option>
              <option value="MANUAL">{t("gateway.MANUAL")}</option>
            </Select>
          </>
        }
        columns={[
          {
            header: t("cols.donor"),
            cell: (r) => (
              <div className="text-sm">
                <p className="text-ink">{r.donorName || t("anonymous")}</p>
                {r.donorEmail ? <p className="text-xs text-ink-3" dir="ltr">{r.donorEmail}</p> : null}
              </div>
            ),
          },
          { header: t("cols.amount"), cell: (r) => <span className="whitespace-nowrap text-sm font-medium" dir="ltr">{money(r.amount, r.currency)}</span> },
          {
            header: t("cols.method"),
            cell: (r) => (
              <div className="text-sm">
                <p className="text-ink">{r.gateway === "PAYMOB" ? t("gateway.PAYMOB") : t(`methods.${r.method ?? "OTHER"}`)}</p>
                {r.reference ? <p className="text-xs text-ink-3" dir="ltr">{r.reference}</p> : null}
              </div>
            ),
          },
          { header: t("cols.message"), cell: (r) => <p className="line-clamp-2 max-w-xs text-sm text-ink-2">{r.message ?? ""}</p> },
          { header: t("cols.date"), cell: (r) => <span className="whitespace-nowrap text-sm">{formatDateTime(r.completedAt ?? r.createdAt, locale)}</span> },
          { header: t("cols.status"), cell: (r) => <Badge tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</Badge> },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recordTitle")}</DialogTitle>
            <p className="text-sm text-ink-2">{t("recordHint")}</p>
          </DialogHeader>
          <form onSubmit={(e) => void record(e)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("amountLabel", { currency })} htmlFor="don-amount">
                <Input id="don-amount" type="number" min="1" step="0.01" dir="ltr" required value={form.amount} onChange={set("amount")} />
              </FormField>
              <FormField label={t("cols.method")} htmlFor="don-method">
                <Select id="don-method" className="w-full" value={form.method} onChange={set("method")}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(`methods.${m}`)}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <FormField label={t("reference")} htmlFor="don-ref">
              <Input id="don-ref" dir="ltr" maxLength={255} value={form.reference} onChange={set("reference")} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label={t("donorName")} htmlFor="don-name">
                <Input id="don-name" maxLength={200} value={form.donorName} onChange={set("donorName")} />
              </FormField>
              <FormField label={t("donorEmail")} htmlFor="don-email" hint={t("donorEmailHint")}>
                <Input id="don-email" type="email" dir="ltr" maxLength={255} value={form.donorEmail} onChange={set("donorEmail")} />
              </FormField>
            </div>
            <FormField label={t("messageLabel")} htmlFor="don-msg">
              <Input id="don-msg" maxLength={1000} value={form.message} onChange={set("message")} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={saving || !form.amount}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {t("record")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
