/**
 * @file ProviderEmptyState.tsx
 *
 * Warm, inviting empty-state block for provider dashboards.
 * Intentionally distinct from the admin empty state: larger icon circle,
 * brand-tinted palette, soft entrance animation — designed to encourage
 * the user to act, not just report that a list is empty.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderEmptyState}. */
export interface ProviderEmptyStateProps {
  /**
   * Icon rendered in the soft circular container.
   * Size at `h-8 w-8` — the container is fixed at 80×80 px.
   * Colour is inherited from the container (`--color-brand-500`).
   */
  icon: ReactNode;
  /** Primary message — encouraging, not terse. */
  title: string;
  /** Supporting detail or call-to-action hint. */
  description?: string;
  /**
   * Optional CTA slot.  Pass a `<Button>` or a React Router `<Link>`
   * wrapped in a button.  Rendered below the text block.
   */
  action?: ReactNode;
  /** Extra Tailwind / CSS classes on the root element. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider empty state.
 *
 * Design choices vs. admin:
 * - Icon circle is 80×80 px (vs. 56 px admin) — more prominent, warmer
 * - Brand-50 tint + provider shadow on the circle
 * - Title in display font at `text-lg`
 * - Entrance via `.provider-scale-in` for a welcoming feel
 * - No dashed border — cleaner, more spacious look
 */
export function ProviderEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: ProviderEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 text-center",
        "provider-scale-in",
        className,
      )}
    >
      {/* Icon container ──────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full",
          "bg-[var(--color-brand-50)] text-[var(--color-brand-500)]",
          "shadow-[var(--shadow-provider-sm)]",
        )}
        aria-hidden
      >
        {icon}
      </div>

      {/* Text block ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 px-4">
        <h3
          className={cn(
            "font-[var(--font-display)] text-lg font-semibold",
            "text-[var(--color-ink-body)]",
          )}
        >
          {title}
        </h3>

        {description && (
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-[var(--color-muted)]">
            {description}
          </p>
        )}
      </div>

      {/* CTA slot ────────────────────────────────────────────── */}
      {action && <div>{action}</div>}
    </div>
  );
}
