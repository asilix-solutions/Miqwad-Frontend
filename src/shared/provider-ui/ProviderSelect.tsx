/**
 * @file ProviderSelect.tsx
 *
 * Provider design-system select built on the Radix Select primitive.
 * Trigger matches ProviderInput height / radius / border / focus identity.
 * Dropdown: surface bg, provider-md shadow, rounded content, hover fill, selected
 * brand-orange check mark — RTL-correct (check on inline-end).
 *
 * RULE: Never pass value="" — callers use "all" or a real value as the default.
 * No i18n inside; all labels and placeholder text come from props.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single option for {@link ProviderSelect}. */
export interface ProviderSelectOption {
  /** The value string — never pass an empty string. */
  value: string;
  /** Display label — already translated by the consumer. */
  label: string;
  /** When true, the option is shown but cannot be selected. */
  disabled?: boolean;
}

/** Props for {@link ProviderSelect}. */
export interface ProviderSelectProps {
  /** Controlled value — never an empty string; use "all" or a real value. */
  value: string;
  /** Called with the selected option's value. */
  onValueChange: (value: string) => void;
  /** Available options. */
  options: ProviderSelectOption[];
  /** Placeholder text shown when no value is selected. */
  placeholder?: string;
  /** Label rendered above the trigger. */
  label?: string;
  /** Error message rendered below (danger colour). */
  error?: string;
  /** Disables the entire select control. */
  disabled?: boolean;
  /** Forwarded to the trigger element; useful for form label association. */
  id?: string;
  /** Extra Tailwind / CSS classes on the trigger. */
  className?: string;
}

// ── Style constants ───────────────────────────────────────────────────────────

const TRANSITION: CSSProperties = {
  transition: [
    "border-color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider select — Radix-powered dropdown with provider identity styling.
 *
 * @example
 * ```tsx
 * <ProviderSelect
 *   id="categoryId"
 *   label={t("dealer.products.form.category")}
 *   value={categoryId ?? "all"}
 *   onValueChange={(val) => setValue("categoryId", val)}
 *   options={categories.map(c => ({ value: c.id, label: c.labelAr }))}
 *   placeholder={t("common.select")}
 *   error={errors.categoryId && t(errors.categoryId.message!)}
 * />
 * ```
 */
export function ProviderSelect({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  error,
  disabled,
  id,
  className,
}: ProviderSelectProps) {
  const hasId = Boolean(id);

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

      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={hasId && error ? `${id}-error` : undefined}
          style={TRANSITION}
          className={cn(
            "inline-flex h-[var(--size-input-h)] w-full items-center justify-between gap-2",
            "rounded-[var(--radius-md)] border bg-[var(--color-surface)]",
            "ps-3 pe-3 text-sm text-[var(--color-ink-body)] outline-none",
            // Placeholder text — Radix adds data-placeholder when no value shown
            "data-[placeholder]:text-[var(--color-muted)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:ring-2",
            error
              ? [
                  "border-[var(--color-danger-500)]",
                  "focus-visible:border-[var(--color-danger-500)]",
                  "focus-visible:ring-[var(--color-danger-500)]/20",
                ]
              : [
                  "border-[var(--color-divider)]",
                  "focus-visible:border-[var(--color-brand-orange)]",
                  "focus-visible:ring-[var(--color-brand-orange)]/20",
                ],
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />

          <SelectPrimitive.Icon asChild>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-[var(--color-muted)]"
              aria-hidden
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              "z-50 min-w-[var(--radix-select-trigger-width)]",
              "overflow-hidden rounded-[var(--radius-md)]",
              "border border-[var(--color-divider)] bg-[var(--color-surface)]",
              "shadow-[var(--shadow-provider-md)]",
              // Open / close animation (tw-animate-css)
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            )}
            style={{ animationDuration: "var(--dur-fast)" }}
          >
            <SelectPrimitive.Viewport className="p-1.5">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "relative flex cursor-default select-none items-center justify-between",
                    "rounded-[var(--radius-sm)] ps-3 pe-8 py-2 text-sm",
                    "text-[var(--color-ink-body)] outline-none",
                    "transition-colors duration-[var(--dur-fast)]",
                    "data-[highlighted]:bg-[var(--color-surface-2)]",
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
                    "data-[state=checked]:font-medium",
                  )}
                >
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>

                  {/* Check mark — absolute end for RTL correctness */}
                  <span className="absolute end-2 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check
                        className="h-4 w-4 text-[var(--color-brand-orange)]"
                        aria-hidden
                      />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>

      {error && (
        <p
          id={hasId ? `${id}-error` : undefined}
          role="alert"
          className="text-xs text-[var(--color-danger-500)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
