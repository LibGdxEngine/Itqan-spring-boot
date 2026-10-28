"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/use-focus-trap";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>");
  }
  return context;
}

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open: openProp, onOpenChange }: DialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const titleId = React.useId();

  return (
    <DialogContext.Provider value={{ open, setOpen, titleId }}>
      {children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialogContext();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      {...props}
      onClick={(event: React.MouseEvent<HTMLElement>) => {
        props.onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
        setOpen(true);
      }}
    >
      {children}
    </Comp>
  );
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, setOpen, titleId } = useDialogContext();
  const t = useTranslations("common");
  const panelRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open, () => setOpen(false));

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
        aria-label={t("close")}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg outline-none border border-line-strong bg-surface p-4 shadow-xl sm:p-6",
          className
        )}
        {...props}
      >
        <button
          type="button"
          className="absolute end-3 top-3 rounded-md p-1 text-ink-3 hover:bg-subtle"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1.5", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2 id={titleId} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  );
}
