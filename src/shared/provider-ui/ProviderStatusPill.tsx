/**
 * @file ProviderStatusPill.tsx
 *
 * Compact status indicator pill for provider dashboards.
 * Intentionally distinct from the admin StatusBadge: softer tinted background,
 * gentler palette, tiny leading dot — matches the warm, modern provider identity.
 *
 * The `label` prop must be an already-translated string from the consumer.
 * This component is purely presentational — no i18n inside.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Semantic colour tone for {@link ProviderStatusPill}. */
export type StatusPillTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "brand";

/** Props for {@link ProviderStatusPill}. */
export interface ProviderStatusPillProps {
  /** Display text — must be translated by the consumer before passing. */
  label: string;
  /** Colour tone applied to background, dot, and text. */
  tone: StatusPillTone;
  /** Extra Tailwind / CSS classes on the root element. */
  className?: string;
}

// ── Tone map ──────────────────────────────────────────────────────────────────

// All class strings are static literals so Tailwind v4's content scanner
// can detect them without dynamic interpolation.
const TONE: Record<
  StatusPillTone,
  { wrapper: string; dot: string; text: string }
> = {
  success: {
    wrapper: "bg-[var(--color-success-50)]",
    dot:     "bg-[var(--color-success-500)]",
    text:    "text-[var(--color-success-500)]",
  },
  warning: {
    wrapper: "bg-[var(--color-warning-50)]",
    dot:     "bg-[var(--color-warning-500)]",
    text:    "text-[var(--color-warning-500)]",
  },
  danger: {
    wrapper: "bg-[var(--color-danger-50)]",
    dot:     "bg-[var(--color-danger-500)]",
    text:    "text-[var(--color-danger-500)]",
  },
  info: {
    wrapper: "bg-[var(--color-info-50)]",
    dot:     "bg-[var(--color-info-500)]",
    text:    "text-[var(--color-info-500)]",
  },
  neutral: {
    wrapper: "bg-[var(--color-surface-2)]",
    dot:     "bg-[var(--color-muted)]",
    text:    "text-[var(--color-muted)]",
  },
  brand: {
    wrapper: "bg-[var(--color-brand-50)]",
    dot:     "bg-[var(--color-brand-orange)]",
    text:    "text-[var(--color-brand-orange)]",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider status pill — soft tinted chip with a leading dot and tone-coloured text.
 *
 * Design choices vs. admin StatusBadge:
 * - Lighter background tint (semantic -50 shades), no solid fill
 * - `--radius-pill` for a fully rounded pill shape
 * - Tiny 6 px leading dot instead of a bold block colour
 * - Compact sizing (`text-xs`, `py-0.5 px-2.5`) — readable but unobtrusive
 */
export function ProviderStatusPill({
  label,
  tone,
  className,
}: ProviderStatusPillProps) {
  const t = TONE[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "rounded-[var(--radius-pill)] px-2.5 py-0.5",
        "text-xs font-medium",
        t.wrapper,
        t.text,
        className,
      )}
    >
      {/* Leading dot ─────────────────────────────────────────── */}
      <span
        aria-hidden
        className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", t.dot)}
      />
      {label}
    </span>
  );
}
