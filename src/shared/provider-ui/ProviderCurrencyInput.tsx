/**
 * @file ProviderCurrencyInput.tsx
 *
 * Dedicated currency input component for provider workflows.
 * Keeps the Saudi Riyal currency symbol outside the editable numeric text area
 * in a docked, non-editable affix container.
 *
 * Prevents any collision between currency iconography, text selection,
 * cursor positioning, and browser-native spinners.
 *
 * Supports react-hook-form via forwardRef and standard numeric input semantics.
 */

import {
  forwardRef,
  useId,
  useRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@shared/lib/utils";
import { SaudiRiyalIcon } from "@shared/components/icons/SaudiRiyalIcon";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProviderCurrencyInputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type"
> {
  /** Label rendered above the input. */
  label?: string;
  /** Subtitle / helper context displayed directly with the label (e.g. "سعر القطعة الواحدة"). */
  unitContext?: string;
  /** Error message rendered below (danger colour). Suppresses hint when set. */
  error?: string;
  /** Helper text rendered below the input (muted). Hidden when error is set. */
  hint?: string;
  /**
   * Whether this field is required. When true, renders a red asterisk adjacent
   * to the label and sets aria-required and required on the input.
   */
  required?: boolean;
  /** Currency label text shown in the affix badge (defaults to "ر.س"). */
  currencyLabel?: string;
  /** Optional icon to override or supplement the currency icon. */
  currencyIcon?: ReactNode;
}

// ── Style constants ───────────────────────────────────────────────────────────

const TRANSITION: CSSProperties = {
  transition: [
    "border-color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

export const ProviderCurrencyInput = forwardRef<HTMLInputElement, ProviderCurrencyInputProps>(
  (
    {
      label,
      unitContext,
      error,
      hint,
      required,
      currencyLabel = "ر.س",
      currencyIcon,
      className,
      id: explicitId,
      disabled,
      min = 0,
      step = 1,
      style,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink-body)]">
              {label}
              {required && (
                <span
                  className="ms-1 font-bold text-[var(--color-danger-500)] select-none"
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
            {unitContext && (
              <span className="text-xs font-normal text-[var(--color-muted)] select-none">
                {unitContext}
              </span>
            )}
          </div>
        )}

        {/* Cohesive container wrapping the numeric input and the docked currency affix */}
        <div
          onClick={() => inputRef.current?.focus()}
          style={{ ...TRANSITION, ...style }}
          className={cn(
            "flex h-[var(--size-input-h)] w-full items-stretch overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
            error
              ? [
                  "border-[var(--color-danger-500)]",
                  "focus-within:border-[var(--color-danger-500)]",
                  "focus-within:ring-2 focus-within:ring-[var(--color-danger-500)]/20",
                ]
              : [
                  "border-[var(--color-divider)]",
                  "focus-within:border-[var(--color-brand-orange)]",
                  "focus-within:ring-2 focus-within:ring-[var(--color-brand-orange)]/20",
                ],
            disabled && "cursor-not-allowed bg-[var(--color-surface-2)] opacity-50",
            className,
          )}
        >
          {/* Editable numeric text field — clean, isolated, no floating absolute icons */}
          <input
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            id={id}
            type="number"
            min={min}
            step={step}
            dir="ltr"
            required={required}
            disabled={disabled}
            aria-required={required ? true : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="min-w-0 flex-1 [appearance:textfield] border-0 bg-transparent px-3.5 text-base font-semibold text-[var(--color-ink-body)] outline-none placeholder:font-normal placeholder:text-[var(--color-muted)] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            {...rest}
          />

          {/* Docked currency affix badge — completely outside the editable text area */}
          <div
            className="flex shrink-0 cursor-pointer items-center gap-1.5 border-s border-[var(--color-divider)] bg-[var(--color-surface-2)] px-3 text-xs font-semibold text-[var(--color-ink-secondary)] select-none"
            aria-hidden="true"
          >
            {currencyIcon ?? (
              <SaudiRiyalIcon
                className="h-4 w-4 shrink-0 text-[var(--color-brand-orange)]"
                aria-hidden="true"
              />
            )}
            <span className="font-semibold text-[var(--color-ink-body)]">{currencyLabel}</span>
          </div>
        </div>

        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-danger-500)]">
            {error}
          </p>
        )}

        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-[var(--color-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

ProviderCurrencyInput.displayName = "ProviderCurrencyInput";
