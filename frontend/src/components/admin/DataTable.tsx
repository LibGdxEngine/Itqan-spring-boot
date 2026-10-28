"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColumnDef, ResponsiveTable } from "@/components/ui/responsive-table"
import { getErrorMessage } from "@/lib/api-axios"
import type { Page } from "@/lib/admin-api"
import { useDebouncedValue } from "@/components/admin/ui"

export interface ServerTableState<T> {
  rows: T[]
  page: number
  totalPages: number
  totalElements: number
  loading: boolean
  error: string | null
  setPage: (page: number) => void
  reload: () => void
  /** Replace one row in place after a mutation, without refetching. */
  updateRow: (predicate: (row: T) => boolean, next: T) => void
}

/**
 * Loads one page at a time from a paged endpoint. `fetchPage` must be stable for a given set
 * of filters (wrap it in useCallback); when it changes the table jumps back to page 0.
 */
export function useServerTable<T>(fetchPage: (page: number) => Promise<Page<T>>): ServerTableState<T> {
  const [page, setPage] = React.useState(0)
  const [data, setData] = React.useState<Page<T> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const lastFetcher = React.useRef(fetchPage)

  React.useEffect(() => {
    // New filters: restart from the first page.
    if (lastFetcher.current !== fetchPage) {
      lastFetcher.current = fetchPage
      if (page !== 0) {
        setPage(0)
        return
      }
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPage(page)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fetchPage, page, reloadToken])

  const updateRow = React.useCallback((predicate: (row: T) => boolean, next: T) => {
    setData((current) =>
      current ? { ...current, content: current.content.map((row) => (predicate(row) ? next : row)) } : current,
    )
  }, [])

  return {
    rows: data?.content ?? [],
    page,
    totalPages: data?.totalPages ?? 0,
    totalElements: data?.totalElements ?? 0,
    loading,
    error,
    setPage,
    reload: () => setReloadToken((n) => n + 1),
    updateRow,
  }
}

/** Search box whose value is debounced before it reaches `onSearch`. */
export function SearchInput({
  onSearch,
  placeholder,
  initialValue = "",
}: {
  onSearch: (value: string) => void
  placeholder?: string
  initialValue?: string
}) {
  const [value, setValue] = React.useState(initialValue)
  const debounced = useDebouncedValue(value)
  const onSearchRef = React.useRef(onSearch)

  React.useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  React.useEffect(() => {
    onSearchRef.current(debounced.trim())
  }, [debounced])

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 ps-9"
        type="search"
      />
    </div>
  )
}

export function DataTable<T>({
  table,
  columns,
  getRowKey,
  actions,
  toolbar,
  emptyMessage,
  onExport,
}: {
  table: ServerTableState<T>
  columns: ColumnDef<T>[]
  getRowKey: (row: T, index: number) => React.Key
  actions?: (row: T) => React.ReactNode
  toolbar?: React.ReactNode
  emptyMessage?: React.ReactNode
  onExport?: () => Promise<void>
}) {
  const t = useTranslations("admin.table")
  const [exporting, setExporting] = React.useState(false)

  const runExport = async () => {
    if (!onExport) return
    setExporting(true)
    try {
      await onExport()
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface">
      {toolbar || onExport ? (
        <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{toolbar}</div>
          {onExport ? (
            <Button variant="outline" size="sm" onClick={() => void runExport()} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              {t("exportCsv")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {table.error ? (
        <div className="flex flex-col gap-3 p-4 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <p>{table.error}</p>
          <Button variant="outline" size="sm" onClick={table.reload}>
            {t("retry")}
          </Button>
        </div>
      ) : table.loading && table.rows.length === 0 ? (
        <div className="space-y-2 p-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-subtle" />
          ))}
        </div>
      ) : (
        <div className={table.loading ? "opacity-60 transition-opacity" : undefined}>
          <ResponsiveTable
            columns={columns}
            rows={table.rows}
            getRowKey={getRowKey}
            actions={actions}
            actionsHeader={t("actions")}
            emptyState={<p className="px-4 py-10 text-center text-sm text-ink-3">{emptyMessage ?? t("empty")}</p>}
          />
        </div>
      )}

      {table.totalPages > 1 || table.totalElements > 0 ? (
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm text-ink-2">
          <span>{t("total", { count: table.totalElements })}</span>
          {table.totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPage(table.page - 1)}
                disabled={table.page === 0 || table.loading}
                aria-label={t("previous")}
              >
                <ChevronLeft className="rtl:rotate-180" />
              </Button>
              <span dir="ltr">
                {table.page + 1} / {table.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPage(table.page + 1)}
                disabled={table.page + 1 >= table.totalPages || table.loading}
                aria-label={t("next")}
              >
                <ChevronRight className="rtl:rotate-180" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
