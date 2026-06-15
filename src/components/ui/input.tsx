import * as React from "react"

import { cn } from "@shared/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  invalid?: boolean;
}

function Input({ className, type, invalid, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      aria-invalid={invalid || props["aria-invalid"]}
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        "h-[var(--size-input-h)] w-full min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-1 text-base shadow-[var(--shadow-1)] transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:ring-2 aria-invalid:ring-danger-500/40 dark:aria-invalid:ring-danger-500/40",
        "data-[invalid=true]:ring-2 data-[invalid=true]:ring-danger-500/40 dark:data-[invalid=true]:ring-danger-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
