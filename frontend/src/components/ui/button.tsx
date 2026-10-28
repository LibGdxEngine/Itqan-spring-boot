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
          "bg-brand text-on-night shadow-[0_0_0_1px_var(--color-brand)] hover:bg-brand-hover hover:shadow-[0_0_0_1px_#b55836] active:scale-[0.99] focus-visible:ring-focus",
        secondary:
          "bg-sand text-ink-button shadow-[0_0_0_1px_var(--color-ring-warm)] hover:shadow-[0_0_0_1px_var(--color-ring-warm)] active:scale-[0.99] focus-visible:ring-focus",
        outline:
          "bg-transparent border border-line-strong text-ink hover:bg-subtle focus-visible:ring-focus",
        ghost:
          "bg-transparent text-ink-2 hover:bg-sand hover:text-ink focus-visible:ring-focus",
        dark:
          "bg-night-2 text-on-night shadow-[0_0_0_1px_var(--color-night-2)] hover:bg-night active:scale-[0.99] focus-visible:ring-focus",
        white:
          "bg-paper text-ink shadow-[0_0_0_1px_var(--color-line-strong)] hover:bg-surface active:scale-[0.99] focus-visible:ring-focus",
        destructive:
          "bg-danger text-on-night shadow-[0_0_0_1px_var(--color-danger)] hover:bg-danger-hover active:scale-[0.99] focus-visible:ring-focus",
        link:
          "text-brand underline-offset-4 hover:underline",
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
