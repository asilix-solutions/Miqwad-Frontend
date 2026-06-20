/**
 * @file ProviderSearchBar.tsx
 *
 * Controlled search input with a leading Search icon and an optional clear (X)
 * button that appears when the field has text.  Debouncing is the caller's job —
 * this component is fully controlled: value + onChange + onClear.
 *
 * All visible text (placeholder) comes from the caller.
 * No i18n inside this component.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderSearchBar}. */
export interface ProviderSearchBarProps {
  /** Current search string (controlled). */
  value: string;
  /** Called with the new string on every keystroke. */
  onChange: (value: string) => void;
  /** Called when the user clicks the clear (X) button. */
  onClear?: () => void;
  /** Placeholder text — already translated by the consumer. */
  placeholder?: string;
  /** Disables the input. */
  disabled?: boolean;
  /** Extra Tailwind / CSS classes on the root wrapper. */
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
 * Provider search bar — controlled, with leading icon and optional clear button.
 *
 * @example
 * ```tsx
 * <ProviderSearchBar
 *   value={search}
 *   onChange={setSearch}
 *   onClear={() => setSearch("")}
 *   placeholder={t("dealer.products.search")}
 *   className="sm:max-w-xs"
 * />
 * ```
 */
export function ProviderSearchBar({
  value,
  onChange,
  onClear,
  placeholder,
  disabled,
  className,
}: ProviderSearchBarProps) {
  const hasClear = Boolean(value && onClear);

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Leading search icon */}
      <Search
        className="pointer-events-none absolute start-3 h-4 w-4 shrink-0 text-[var(--color-muted)]"
        aria-hidden
      />

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={TRANSITION}
        className={cn(
          "block h-[var(--size-input-h)] w-full",
          "rounded-[var(--radius-md)] border border-[var(--color-divider)]",
          "bg-[var(--color-surface)] ps-10 text-sm",
          "text-[var(--color-ink-body)] placeholder:text-[var(--color-muted)]",
          "outline-none",
          "focus-visible:border-[var(--color-brand-orange)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Make room for the clear button when visible
          hasClear ? "pe-10" : "pe-3",
          // Hide the native browser clear button that type="search" adds
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />

      {/* Clear button — only shown when there is text and onClear is provided */}
      {hasClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="clear"
          tabIndex={-1}
          className={cn(
            "absolute end-3 flex h-5 w-5 shrink-0 items-center justify-center",
            "rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted)]",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--color-divider)] hover:text-[var(--color-ink-body)]",
          )}
        >
          <X className="h-3 w-3" aria-hidden />
        </button>
      )}
    </div>
  );
}
