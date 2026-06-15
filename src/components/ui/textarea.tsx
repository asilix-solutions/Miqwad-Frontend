import * as React from "react"

import { cn } from "@shared/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-base shadow-[var(--shadow-1)] transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-danger-500/40 md:text-sm dark:bg-input/30 dark:aria-invalid:ring-danger-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
