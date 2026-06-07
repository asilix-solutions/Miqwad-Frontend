import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@shared/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // Shared tones mapped to theme colors:
        neutral: "bg-ink-100 text-ink-700",
        brand: "bg-brand-50 text-brand-600",
        success: "bg-success-50 text-success-500",
        warning: "bg-warning-50 text-warning-500",
        danger: "bg-danger-50 text-danger-500",
        info: "bg-info-50 text-info-500",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        sm: "h-5 px-2 text-[11px]",
        md: "h-7 px-3 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  tone?: BadgeTone;
}

function Badge({
  className,
  variant,
  tone,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot.Root : "span"
  
  // If `tone` is provided, use it as the variant to maintain backward compatibility.
  const activeVariant = tone || variant || "default";

  return (
    <Comp
      data-slot="badge"
      data-variant={activeVariant}
      className={cn(badgeVariants({ variant: activeVariant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
