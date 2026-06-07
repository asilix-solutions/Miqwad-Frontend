import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@shared/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-[var(--font-main)] font-semibold whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        primary: "bg-[var(--color-brand-orange)] text-white shadow-brand hover:bg-[var(--color-brand-orange-hover)] active:bg-brand-700",
        secondary: "bg-[var(--color-brand-blue)] text-white hover:bg-navy-600 active:bg-navy-700",
        outline: "border border-ink-200 bg-white text-ink-900 hover:bg-ink-100 active:bg-ink-200",
        ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
        destructive: "bg-danger-500 text-white hover:bg-danger-500/90 active:bg-danger-500/80",
        link: "text-[var(--color-brand-orange)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[var(--size-input-h)] px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-3 text-xs",
        md: "h-[var(--size-input-h)] px-5 text-sm",
        lg: "h-11 px-10 text-base",
        icon: "h-10 w-10",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "md",
  block,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, block, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
