import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@shared/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-sm)] border bg-white px-3 py-2 text-sm transition-colors placeholder:text-ink-400",
        "border-ink-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[invalid=true]:border-danger-500 data-[invalid=true]:ring-danger-500/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
