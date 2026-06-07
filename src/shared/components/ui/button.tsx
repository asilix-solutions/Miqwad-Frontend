import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@shared/lib/utils";
import { buttonVariants } from "./buttonVariants";

/**
 * Brand button.
 *
 * Variants follow the Design System:
 *   primary  – Orange CTA with brand shadow
 *   secondary – Navy filled
 *   outline  – bordered, neutral
 *   ghost    – text-only, hover background
 *   destructive – danger filled
 *
 * Sizes use the spacing scale from the DS PDF.
 */

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
