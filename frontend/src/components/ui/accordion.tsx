"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
}

export function Accordion({ className, children, ...props }: AccordionProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {children}
    </div>
  );
}

interface AccordionItemContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionTrigger/AccordionContent must be inside AccordionItem");
  }
  return context;
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ className, children, ...props }: AccordionItemProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <AccordionItemContext.Provider value={{ open, setOpen }}>
      <div className={cn("rounded-md border border-slate-200", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useAccordionItem();

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-slate-50",
        className
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
    </button>
  );
}

export function AccordionContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useAccordionItem();

  if (!open) {
    return null;
  }

  return (
    <div className={cn("px-4 pb-3", className)} {...props}>
      {children}
    </div>
  );
}
