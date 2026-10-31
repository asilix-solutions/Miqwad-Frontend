/**
 * @file ProviderQuantityInput.tsx
 *
 * Dedicated quantity stepper input for provider inventory forms.
 * Combines accessible decrement (-) and increment (+) buttons with a
 * centered, directly editable numeric input and optional unit indicator.
 *
 * Eliminates native spinner overlap defects while providing instant, tactile
 * single-click adjustments for stock management.
 *
 * Supports react-hook-form via forwardRef and controlled/uncontrolled usage.
 */

import {
  forwardRef,
  useId,
  useRef,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
} from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProviderQuantityInputProps extends Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "onChange"
> {
  /** Label rendered above the input. */
  label?: string;
  /** Subtitle / helper context displayed directly with the label. */
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
  /** Unit label rendered next to the number (e.g. "قطعة" / "وحدة"). */
  unitLabel?: string;
  /** Accessible label for the decrease button. */
  decreaseAriaLabel?: string;
  /** Accessible label for the increase button. */
  increaseAriaLabel?: string;
  /** Callback fired when value changes either via buttons or typing. */
  onValueChange?: (val: number) => void;
  /** Standard change handler fallback. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

// ── Style constants ───────────────────────────────────────────────────────────

const TRANSITION: CSSProperties = {
  transition: [
    "border-color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

export const ProviderQuantityInput = forwardRef<HTMLInputElement, ProviderQuantityInputProps>(
  (
    {
      label,
      unitContext,
      error,
      hint,
      required,
      unitLabel,
      decreaseAriaLabel = "Decrease quantity",
      increaseAriaLabel = "Increase quantity",
      onValueChange,
      onChange,
      min = 1,
      max,
      step = 1,
      value,
      defaultValue,
      disabled,
      className,
      id: explicitId,
      style,
      ...rest
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = explicitId || generatedId;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const numericMin = typeof min === "number" ? min : Number(min) || 1;
    const numericMax = typeof max === "number" ? max : max ? Number(max) : undefined;
    const numericStep = typeof step === "number" ? step : Number(step) || 1;

    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    const updateValue = (nextVal: number) => {
      const clamped = Math.max(
        numericMin,
        numericMax !== undefined ? Math.min(numericMax, nextVal) : nextVal,
      );

      if (onValueChange) {
        onValueChange(clamped);
      }

      const input = inputRef.current;
      if (input) {
        // Use native property setter so React Hook Form's event listeners fire
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value",
        )?.set;
        nativeSetter?.call(input, String(clamped));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    const handleStep = (delta: number) => {
      const input = inputRef.current;
      const currentVal =
        typeof value === "number" ? value : input ? Number(input.value) || numericMin : numericMin;
      updateValue(currentVal + delta);
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10);
      if (!Number.isNaN(parsed) && onValueChange) {
        onValueChange(parsed);
      }
      onChange?.(e);
    };

    const isCurrentAtMin = typeof value === "number" && value <= numericMin;
    const isCurrentAtMax =
      numericMax !== undefined && typeof value === "number" && value >= numericMax;

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

        <div
          style={{ ...TRANSITION, ...style }}
          className={cn(
            "flex h-[var(--size-input-h)] w-full items-center justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface)] p-1",
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
          {/* Decrement Button */}
          <button
            type="button"
            disabled={disabled || isCurrentAtMin}
            onClick={() => handleStep(-numericStep)}
            aria-label={decreaseAriaLabel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] active:bg-[var(--color-divider)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* Centered editable number field */}
          <div className="flex flex-1 items-center justify-center gap-1.5 px-2">
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
              dir="ltr"
              min={numericMin}
              max={numericMax}
              step={numericStep}
              value={value}
              defaultValue={defaultValue}
              required={required}
              disabled={disabled}
              onChange={handleInputChange}
              aria-required={required ? true : undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              className="w-full [appearance:textfield] border-0 bg-transparent text-center text-base font-semibold text-[var(--color-ink-body)] outline-none disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              {...rest}
            />
            {unitLabel && (
              <span className="shrink-0 text-xs font-medium text-[var(--color-muted)] select-none">
                {unitLabel}
              </span>
            )}
          </div>

          {/* Increment Button */}
          <button
            type="button"
            disabled={disabled || isCurrentAtMax}
            onClick={() => handleStep(numericStep)}
            aria-label={increaseAriaLabel}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)] active:bg-[var(--color-divider)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
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

ProviderQuantityInput.displayName = "ProviderQuantityInput";
