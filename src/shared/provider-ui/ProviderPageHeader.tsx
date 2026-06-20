/**
 * @file ProviderPageHeader.tsx
 *
 * Standardised page-title block for provider dashboards.
 * Renders a responsive row: optional leading icon + title/subtitle on the
 * inline-start side, an actions slot on the inline-end side.
 *
 * RTL note: uses direction-neutral flex utilities (`justify-between`,
 * `items-start`, `gap-*`).  The flex row reverses automatically for RTL
 * document direction — title group appears on the right in Arabic, actions
 * on the left, without any LTR/RTL branching in this component.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { ReactNode } from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderPageHeader}. */
export interface ProviderPageHeaderProps {
  /** Page title — rendered as `<h1>` in the display font. */
  title: string;
  /** Supporting subtitle below the title. */
  subtitle?: string;
  /**
   * Action slot on the inline-end side.  On mobile it stacks below the
   * title block.  Pass a `<Button>` or any React node.
   */
  actions?: ReactNode;
  /**
   * Optional leading icon.  Rendered inside a soft brand-tinted rounded
   * container (`--color-brand-50` bg, `--color-brand-500` icon colour).
   * Size the icon at `h-5 w-5` — the container is fixed at 40×40 px.
   */
  icon?: ReactNode;
  /** Extra Tailwind / CSS classes on the root wrapper. */
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Provider page header — title + subtitle block with optional icon and actions. */
export function ProviderPageHeader({
  title,
  subtitle,
  actions,
  icon,
  className,
}: ProviderPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Title group (icon + text) ──────────────────────────────── */}
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center",
              "rounded-[var(--radius-md)]",
              "bg-[var(--color-brand-50)] text-[var(--color-brand-500)]",
            )}
            aria-hidden
          >
            {icon}
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          <h1
            className={cn(
              "font-[var(--font-display)] text-2xl font-bold leading-tight",
              "text-[var(--color-ink-body)]",
            )}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-[var(--color-muted)]">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Actions slot ────────────────────────────────────────────── */}
      {actions && (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
