import * as React from "react";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * A label/value row used inside mobile "card" representations of data tables.
 * Renders the label on one side and the value on the other; `justify-between`
 * works correctly in both LTR and RTL layouts.
 */
export function Field({ label, children, className }: FieldProps) {
  return (
    <div className={cn("flex justify-between gap-3 py-1", className)}>
      <span className="shrink-0 text-ink-3">{label}</span>
      <span className="text-end text-ink">{children}</span>
    </div>
  );
}
