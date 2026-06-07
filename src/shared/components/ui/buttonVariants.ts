import { cva } from "class-variance-authority";

/**
 * Button class variance definition.
 * Split out of `button.tsx` so the component file only exports
 * components (Fast Refresh requirement).
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-[var(--font-main)] text-sm font-semibold transition-colors transition-shadow disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-orange)]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-brand-orange)] text-white shadow-brand hover:bg-[var(--color-brand-orange-hover)] active:bg-brand-700",
        secondary: "bg-[var(--color-brand-blue)] text-white hover:bg-navy-600 active:bg-navy-700",
        outline:
          "border border-ink-200 bg-white text-ink-900 hover:bg-ink-100 active:bg-ink-200",
        ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
        destructive: "bg-danger-500 text-white hover:bg-danger-500/90 active:bg-danger-500/80",
        link: "text-[var(--color-brand-orange)] underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-[var(--size-input-h)] px-5 text-sm",
        lg: "h-11 px-10 text-base",
        icon: "h-10 w-10",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  },
);
