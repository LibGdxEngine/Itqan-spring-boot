"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { DataTable, SearchInput, useServerTable } from "@/components/admin/DataTable"
import { Badge, ConfirmDialog, PageHeader, Select, formatDate, formatDateTime } from "@/components/admin/ui"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-context"
import { getErrorMessage } from "@/lib/api-axios"
import { AdminUserRow, UserFilters, adminUsersApi, downloadCsv } from "@/lib/admin-api"

export default function AdminUsersPage() {
  const t = useTranslations("admin.users")
  const tc = useTranslations("admin.common")
  const locale = useLocale()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  const [filters, setFilters] = React.useState<UserFilters>({ q: "", role: "", enabled: "" })
  const [pending, setPending] = React.useState<AdminUserRow | null>(null)
  const [busy, setBusy] = React.useState(false)

  const fetchPage = React.useCallback((page: number) => adminUsersApi.search({ ...filters, page, size: 20 }), [filters])
  const table = useServerTable(fetchPage)

  const toggleStatus = async () => {
    if (!pending) return
    setBusy(true)
    try {
      const updated = await adminUsersApi.setEnabled(pending.id, !pending.enabled)
      table.updateRow((row) => row.id === updated.id, updated)
      toast({ title: updated.enabled ? t("reactivated") : t("suspended") })
      setPending(null)
    } catch (error) {
      toast({ title: tc("failed"), description: getErrorMessage(error), variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = async () => {
    const rows = await adminUsersApi.export(filters)
    downloadCsv("users.csv", rows, [
      { header: "id", value: (r) => r.id },
      { header: "first_name", value: (r) => r.firstName },
      { header: "last_name", value: (r) => r.lastName },
      { header: "email", value: (r) => r.email },
      { header: "role", value: (r) => r.role },
      { header: "enabled", value: (r) => r.enabled },
      { header: "sign_in", value: (r) => r.authProvider },
      { header: "created_at", value: (r) => r.createdAt },
      { header: "last_login_at", value: (r) => r.lastLoginAt ?? "" },
    ])
  }

  return (
    <>
      <PageHeader title={t("title")} description={t("description")} />

      <DataTable
        table={table}
        getRowKey={(row) => row.id}
        onExport={exportCsv}
        emptyMessage={t("empty")}
        toolbar={
          <>
            <SearchInput placeholder={t("search")} onSearch={(q) => setFilters((f) => (f.q === q ? f : { ...f, q }))} />
            <Select
              aria-label={t("role")}
              value={filters.role}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value as UserFilters["role"] }))}
            >
              <option value="">{t("allRoles")}</option>
              <option value="STUDENT">{t("roles.STUDENT")}</option>
              <option value="INSTRUCTOR">{t("roles.INSTRUCTOR")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </Select>
            <Select
              aria-label={t("status")}
              value={filters.enabled}
              onChange={(e) => setFilters((f) => ({ ...f, enabled: e.target.value as UserFilters["enabled"] }))}
            >
              <option value="">{t("allStatuses")}</option>
              <option value="true">{tc("active")}</option>
              <option value="false">{t("suspendedLabel")}</option>
            </Select>
          </>
        }
        columns={[
          {
            header: t("name"),
            cell: (row) => (
              <div>
                <p className="font-medium text-ink">
                  {row.firstName} {row.lastName}
                </p>
                <p className="text-xs text-ink-3" dir="ltr">
                  {row.email}
                </p>
              </div>
            ),
          },
          {
            header: t("role"),
            cell: (row) => (
              <div className="flex flex-wrap gap-1">
                <Badge tone={row.role === "ADMIN" ? "accent" : row.role === "INSTRUCTOR" ? "amber" : "gray"}>
                  {t(`roles.${row.role}`)}
                </Badge>
                {row.superAdmin ? <Badge tone="accent">{t("superAdmin")}</Badge> : null}
              </div>
            ),
          },
          {
            header: t("status"),
            cell: (row) =>
              row.enabled ? <Badge tone="green">{tc("active")}</Badge> : <Badge tone="red">{t("suspendedLabel")}</Badge>,
          },
          { header: t("signIn"), cell: (row) => (row.authProvider === "GOOGLE" ? "Google" : t("password")) },
          { header: t("joined"), cell: (row) => formatDate(row.createdAt, locale) },
          { header: t("lastLogin"), cell: (row) => formatDateTime(row.lastLoginAt, locale) },
        ]}
        actions={(row) =>
          row.id === currentUser?.id ? null : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPending(row)}
              className={row.enabled ? "text-danger" : undefined}
            >
              {row.enabled ? t("suspend") : t("reactivate")}
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.enabled ? t("confirmSuspendTitle") : t("confirmReactivateTitle")}
        description={
          pending
            ? pending.enabled
              ? t("confirmSuspend", { name: `${pending.firstName} ${pending.lastName}` })
              : t("confirmReactivate", { name: `${pending.firstName} ${pending.lastName}` })
            : undefined
        }
        confirmLabel={pending?.enabled ? t("suspend") : t("reactivate")}
        cancelLabel={tc("cancel")}
        destructive={pending?.enabled}
        busy={busy}
        onConfirm={() => void toggleStatus()}
      />
    </>
  )
}
