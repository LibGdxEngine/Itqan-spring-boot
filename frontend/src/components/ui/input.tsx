import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-line-strong bg-surface px-4 py-2 text-base shadow-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
          "placeholder:text-ink-3",
          "hover:border-brand hover:shadow-md",
          "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-subtle",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
