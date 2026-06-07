import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

/**
 * Native <select> styled to match the design system.
 *
 * Why native instead of Radix:
 *   - Works seamlessly with react-hook-form's `register`.
 *   - Mobile keyboards render the native picker (better UX).
 *   - Lighter bundle for what is, in practice, a simple dropdown.
 *
 * RTL: the chevron is positioned with `inset-inline-end` (logical
 * property) so it flips automatically with `<html dir="rtl">`.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        data-invalid={invalid ? "true" : undefined}
        className={cn(
          "flex h-11 w-full appearance-none rounded-[var(--radius-sm)] border bg-white px-3 py-2 pe-9 text-sm transition-colors",
          "border-ink-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[invalid=true]:border-danger-500 data-[invalid=true]:ring-danger-500/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
    </div>
  ),
);
Select.displayName = "Select";
