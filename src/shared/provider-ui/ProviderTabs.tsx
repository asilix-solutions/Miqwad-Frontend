/**
 * @file ProviderTabs.tsx
 *
 * Pill-style tab / segment-control for provider dashboards.
 * Controlled component — the parent owns the active value and is notified
 * via `onChange` on selection.
 *
 * Design highlights vs. admin tabs:
 * - Active: solid brand-orange pill, white label, semibold
 * - Inactive: muted text, surface-2 hover fill
 * - Motion via `--dur-fast` + `--ease-provider` tokens (inline style)
 * - Optional per-tab count badge (subtle chip, dimmed when active)
 * - Wraps gracefully on narrow viewports; horizontal scroll as edge-case fallback
 *
 * No i18n inside — all labels are already-translated strings from the consumer.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single tab descriptor for {@link ProviderTabs}. */
export interface ProviderTabItem {
  /** Unique value passed to `onChange` when this tab is selected. */
  value: string;
  /** Display label — already translated by the consumer. */
  label: string;
  /**
   * Optional live count badge beside the label.
   * Use for list lengths (e.g. "Active (3)").  `0` is rendered as "0".
   */
  count?: number;
}

/** Props for {@link ProviderTabs}. */
export interface ProviderTabsProps {
  /** Tab descriptors, rendered in the given order. */
  tabs: ProviderTabItem[];
  /** Currently selected tab value. */
  value: string;
  /** Called with the newly selected value when a tab button is pressed. */
  onChange: (value: string) => void;
  /** Extra Tailwind / CSS classes on the scroll container. */
  className?: string;
}

// ── Motion style ──────────────────────────────────────────────────────────────

// Defined once and shared by all pill buttons to avoid per-render objects.
const PILL_TRANSITION: CSSProperties = {
  transition: [
    "background-color var(--dur-fast) var(--ease-provider)",
    "color var(--dur-fast) var(--ease-provider)",
    "box-shadow var(--dur-fast) var(--ease-provider)",
  ].join(", "),
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider pill tabs — horizontal segment control.
 *
 * Uses `role="tablist"` / `role="tab"` semantics, suitable for filter / segment
 * controls that switch list content.  Keyboard-accessible via browser defaults
 * (Tab key moves focus; Enter / Space selects).
 */
export function ProviderTabs({
  tabs,
  value,
  onChange,
  className,
}: ProviderTabsProps): ReactNode {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap gap-1.5",
        // Horizontal scroll safety net for edge-case narrow containers
        "overflow-x-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            style={PILL_TRANSITION}
            className={cn(
              // Layout
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap",
              "rounded-[var(--radius-md)] px-4 py-2 text-sm",
              // Active
              active && [
                "bg-[var(--color-brand-orange)] text-white font-semibold",
                "shadow-[var(--shadow-provider-sm)]",
              ],
              // Inactive
              !active && [
                "font-medium text-[var(--color-muted)]",
                "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
              ],
            )}
          >
            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[1.25rem] items-center justify-center",
                  "rounded-full px-1 text-xs font-medium",
                  active
                    ? "bg-white/25 text-white"
                    : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
