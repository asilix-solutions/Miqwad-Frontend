/**
 * @file ProviderInput.tsx
 *
 * Provider design-system text / number input.
 * Matching the warm, polished provider identity: surface bg, md radius,
 * brand-orange focus ring, smooth transitions, label / hint / error slots,
 * optional leading and trailing icon slots.
 *
 * Compatible with react-hook-form `register` via forwardRef.
 * All visible text (label, hint, error, placeholder) comes from the caller.
 * No i18n inside this component.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderInput}. */
export interface ProviderInputProps extends ComponentPropsWithoutRef<"input"> {
  /** Label rendered above the input. */
  label?: string;
  /** Error message rendered below (danger colour). Suppresses hint when set. */
  error?: string;
  /** Helper text rendered below the input (muted). Hidden when error is set. */
  hint?: string;
  /** Icon node (lucide) rendered at the inline-start of the input. */
  leadingIcon?: ReactNode;
  /** Icon node (lucide) rendered at the inline-end of the input. */
  trailingIcon?: ReactNode;
}

// ── Style constants ───────────────────────────────────────────────────────────

const BASE =
  "block w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] " +
  "px-3 text-sm text-[var(--color-ink-body)] placeholder:text-[var(--color-muted)] " +
  "outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

// Transition via motion tokens — defined once to avoid per-render allocation.
const TRANSITION: CSSProperties = {
  transition: [
    "border-color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider text / number input.
 *
 * @example
 * ```tsx
 * <ProviderInput
 *   id="nameAr"
 *   label={t("dealer.products.form.nameAr")}
 *   error={errors.nameAr && t(errors.nameAr.message!)}
 *   leadingIcon={<Tag className="h-4 w-4" />}
 *   {...register("nameAr")}
 * />
 * ```
 */
export const ProviderInput = forwardRef<HTMLInputElement, ProviderInputProps>(
  (
    {
      label,
      error,
      hint,
      leadingIcon,
      trailingIcon,
      className,
      id,
      style,
      ...rest
    },
    ref,
  ) => {
    const hasId = Boolean(id);
    const describedBy =
      hasId && error
        ? `${id}-error`
        : hasId && hint
          ? `${id}-hint`
          : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--color-ink-body)]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leadingIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute start-3 flex shrink-0 items-center text-[var(--color-muted)]"
            >
              {leadingIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            style={{ ...TRANSITION, ...style }}
            className={cn(
              BASE,
              "h-[var(--size-input-h)]",
              leadingIcon && "ps-10",
              trailingIcon && "pe-10",
              error
                ? [
                    "border-[var(--color-danger-500)]",
                    "focus-visible:border-[var(--color-danger-500)]",
                    "focus-visible:ring-2 focus-visible:ring-[var(--color-danger-500)]/20",
                  ]
                : [
                    "border-[var(--color-divider)]",
                    "focus-visible:border-[var(--color-brand-orange)]",
                    "focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/20",
                  ],
              className,
            )}
            {...rest}
          />

          {trailingIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute end-3 flex shrink-0 items-center text-[var(--color-muted)]"
            >
              {trailingIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={hasId ? `${id}-error` : undefined}
            role="alert"
            className="text-xs text-[var(--color-danger-500)]"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p
            id={hasId ? `${id}-hint` : undefined}
            className="text-xs text-[var(--color-muted)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

ProviderInput.displayName = "ProviderInput";
