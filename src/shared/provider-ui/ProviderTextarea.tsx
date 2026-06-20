/**
 * @file ProviderTextarea.tsx
 *
 * Provider design-system multiline textarea.
 * Shares the same visual identity as {@link ProviderInput}: surface bg, md radius,
 * brand-orange focus ring, smooth transitions. Resizable on the block (y) axis only.
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
} from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderTextarea}. */
export interface ProviderTextareaProps
  extends ComponentPropsWithoutRef<"textarea"> {
  /** Label rendered above the textarea. */
  label?: string;
  /** Error message rendered below (danger colour). Suppresses hint when set. */
  error?: string;
  /** Helper text rendered below the textarea (muted). Hidden when error is set. */
  hint?: string;
}

// ── Style constants ───────────────────────────────────────────────────────────

const BASE =
  "block w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] " +
  "px-3 py-3 text-sm text-[var(--color-ink-body)] placeholder:text-[var(--color-muted)] " +
  "outline-none resize-y " +
  "min-h-[6rem] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const TRANSITION: CSSProperties = {
  transition: [
    "border-color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider multiline textarea.
 *
 * @example
 * ```tsx
 * <ProviderTextarea
 *   id="descriptionAr"
 *   label={t("dealer.products.form.descriptionAr")}
 *   rows={4}
 *   {...register("descriptionAr")}
 * />
 * ```
 */
export const ProviderTextarea = forwardRef<
  HTMLTextAreaElement,
  ProviderTextareaProps
>(({ label, error, hint, className, id, style, ...rest }, ref) => {
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

      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        style={{ ...TRANSITION, ...style }}
        className={cn(
          BASE,
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
});

ProviderTextarea.displayName = "ProviderTextarea";
