import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-[#e8e6dc] bg-[#faf9f5] px-4 py-2 text-base shadow-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#141413]",
          "placeholder:text-[#87867f]",
          "hover:border-[#c96442] hover:shadow-md",
          "focus-visible:outline-none focus-visible:border-[#c96442] focus-visible:ring-4 focus-visible:ring-[#c96442]/10",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f0eee6]",
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
