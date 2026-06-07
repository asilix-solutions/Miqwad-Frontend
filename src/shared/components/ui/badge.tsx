import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@shared/lib/utils";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Compact pill used inline next to titles. */
  size?: "sm" | "md";
}

/**
 * Small inline pill used to render status (pending, approved, …) and
 * lightweight metadata throughout the app. Tones map to design-system
 * semantic colours so the same primitive carries meaning consistently.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "neutral", size = "md", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-7 px-3 text-xs",
        tone === "neutral" && "bg-ink-100 text-ink-700",
        tone === "brand" && "bg-brand-50 text-brand-600",
        tone === "success" && "bg-success-50 text-success-500",
        tone === "warning" && "bg-warning-50 text-warning-500",
        tone === "danger" && "bg-danger-50 text-danger-500",
        tone === "info" && "bg-info-50 text-info-500",
        className,
      )}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";
