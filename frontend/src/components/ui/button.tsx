import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#c96442] text-[#faf9f5] shadow-[0_0_0_1px_#c96442] hover:bg-[#b55836] hover:shadow-[0_0_0_1px_#b55836] active:scale-[0.99] focus-visible:ring-[#3898ec]",
        secondary:
          "bg-[#e8e6dc] text-[#4d4c48] shadow-[0_0_0_1px_#d1cfc5] hover:shadow-[0_0_0_1px_#c2c0b6] active:scale-[0.99] focus-visible:ring-[#3898ec]",
        outline:
          "bg-transparent border border-[#e8e6dc] text-[#141413] hover:bg-[#f0eee6] focus-visible:ring-[#3898ec]",
        ghost:
          "bg-transparent text-[#5e5d59] hover:bg-[#e8e6dc] hover:text-[#141413] focus-visible:ring-[#3898ec]",
        dark:
          "bg-[#30302e] text-[#faf9f5] shadow-[0_0_0_1px_#30302e] hover:bg-[#141413] active:scale-[0.99] focus-visible:ring-[#3898ec]",
        white:
          "bg-[#ffffff] text-[#141413] shadow-[0_0_0_1px_#e8e6dc] hover:bg-[#faf9f5] active:scale-[0.99] focus-visible:ring-[#3898ec]",
        destructive:
          "bg-[#b53333] text-[#faf9f5] shadow-[0_0_0_1px_#b53333] hover:bg-[#991c1c] active:scale-[0.99] focus-visible:ring-[#3898ec]",
        link:
          "text-[#c96442] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
