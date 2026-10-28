"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, PageHeader, Select, formatDateTime } from "@/components/admin/ui"
import { Input } from "@/components/ui/input"
import { AuditFilters, AuditLogRow, auditLogApi, downloadCsv } from "@/lib/admin-api"

const RESOURCE_TYPES = ["USER", "ADMIN", "INSTRUCTOR", "COURSE", "ENROLLMENT", "PAYMENT", "SETTINGS"]

function MetadataPreview({ metadata }: { metadata: AuditLogRow["metadata"] }) {
  if (!metadata || Object.keys(metadata).length === 0) return <span className="text-ink-3">—</span>
  return (
    <dl className="max-w-xs space-y-0.5 text-xs" dir="ltr">
      {Object.entries(metadata)
        .slice(0, 4)
        .map(([key, value]) => (
          <div key={key} className="flex gap-1">
            <dt className="text-ink-3">{key}:</dt>
            <dd className="truncate text-ink-button">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
          </div>
        ))}
    </dl>
  )
}

export default function AdminAuditLogPage() {
  const t = useTranslations("admin.audit")
  const locale = useLocale()
  const [filters, setFilters] = React.useState<AuditFilters>({ q: "", resourceType: "", status: "", from: "", to: "" })

  const fetchPage = React.useCallback((page: number) => auditLogApi.search({ ...filters, page, size: 50 }), [filters])
  const table = useServerTable(fetchPage)

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable
        table={table}
        getRowKey={(row) => row.id}
        emptyMessage={t("empty")}
        onExport={async () =>
          downloadCsv("audit-log.csv", table.rows, [
            { header: "time", value: (r) => r.createdAt },
            { header: "actor", value: (r) => r.actorEmail ?? "" },
            { header: "action", value: (r) => r.action },
            { header: "resource_type", value: (r) => r.resourceType ?? "" },
            { header: "resource_id", value: (r) => r.resourceId ?? "" },
            { header: "status", value: (r) => r.status },
            { header: "ip", value: (r) => r.ipAddress ?? "" },
            { header: "metadata", value: (r) => (r.metadata ? JSON.stringify(r.metadata) : "") },
          ])
        }
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <Select
              aria-label={t("resource")}
              value={filters.resourceType}
              onChange={(e) => setFilters((f) => ({ ...f, resourceType: e.target.value }))}
            >
              <option value="">{t("allResources")}</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("result")}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as AuditFilters["status"] }))}
            >
              <option value="">{t("allResults")}</option>
              <option value="SUCCESS">{t("success")}</option>
              <option value="FAILURE">{t("failure")}</option>
            </Select>
            <Input
              type="date"
              aria-label={t("from")}
              dir="ltr"
              className="h-9 w-auto"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
            <Input
              type="date"
              aria-label={t("to")}
              dir="ltr"
              className="h-9 w-auto"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </>
        }
        columns={[
          { header: t("time"), cell: (row) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt, locale)}</span> },
          {
            header: t("actor"),
            cell: (row) => (
              <span dir="ltr" className="text-sm">
                {row.actorEmail ?? t("system")}
              </span>
            ),
          },
          {
            header: t("action"),
            cell: (row) => <span className="font-mono text-xs text-ink">{row.action}</span>,
          },
          {
            header: t("resource"),
            cell: (row) =>
              row.resourceType ? (
                <span className="text-xs" dir="ltr">
                  {row.resourceType} #{row.resourceId}
                </span>
              ) : (
                "—"
              ),
          },
          { header: t("details"), cell: (row) => <MetadataPreview metadata={row.metadata} /> },
          {
            header: t("result"),
            cell: (row) =>
              row.status === "SUCCESS" ? <Badge tone="green">{t("success")}</Badge> : <Badge tone="red">{t("failure")}</Badge>,
          },
        ]}
      />
    </>
  )
}
