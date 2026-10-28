import * as React from "react";

import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/field-row";

export interface ColumnDef<T> {
  /** Header text; also used as the label in the mobile card. */
  header: React.ReactNode;
  /** Cell renderer, shared by the desktop row and the mobile card value. */
  cell: (row: T) => React.ReactNode;
  /** Right-align the header/cell on the desktop table (e.g. numeric columns). */
  alignEnd?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => React.Key;
  /** Optional per-row actions, rendered in a trailing column (desktop) and a button row (mobile). */
  actions?: (row: T) => React.ReactNode;
  actionsHeader?: React.ReactNode;
  /** Rendered (for both layouts) when there are no rows. */
  emptyState?: React.ReactNode;
  /** Extra classes for each mobile card (e.g. a different bg when the section is white). */
  mobileCardClassName?: string;
  /** Wrap the desktop table in a rounded border (card-like container). */
  bordered?: boolean;
}

/**
 * Renders a data set as a real <table> on md+ screens and as a stacked list of
 * label/value cards below md — from a single column definition, so the desktop
 * and mobile representations can never drift apart.
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  getRowKey,
  actions,
  actionsHeader,
  emptyState,
  mobileCardClassName,
  bordered,
}: ResponsiveTableProps<T>) {
  if (rows.length === 0) {
    return emptyState ? <>{emptyState}</> : null;
  }

  return (
    <>
      {/* desktop */}
      <div
        className={cn(
          "hidden overflow-x-auto md:block",
          bordered && "rounded-lg border border-line",
        )}
      >
        <table className="min-w-full text-sm">
          <thead className="bg-subtle text-start text-ink-2">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn("px-4 py-3", col.alignEnd && "text-end")}>
                  {col.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 text-end">{actionsHeader}</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={getRowKey(row, idx)} className="border-t border-line">
                {columns.map((col, i) => (
                  <td key={i} className={cn("px-4 py-3 text-ink-button", col.alignEnd && "text-end")}>
                    {col.cell(row)}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3 text-end">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile */}
      <div className="space-y-3 px-4 py-4 md:hidden">
        {rows.map((row, idx) => (
          <div
            key={getRowKey(row, idx)}
            className={cn("rounded-lg border border-line bg-paper p-4 text-sm", mobileCardClassName)}
          >
            {columns.map((col, i) => (
              <Field key={i} label={col.header}>
                {col.cell(row)}
              </Field>
            ))}
            {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions(row)}</div> : null}
          </div>
        ))}
      </div>
    </>
  );
}
