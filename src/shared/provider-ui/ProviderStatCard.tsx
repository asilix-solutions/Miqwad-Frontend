/**
 * @file ProviderStatCard.tsx
 *
 * KPI / metric card for provider dashboards.
 * Built on top of {@link ProviderCard} with a tone-tinted circular icon
 * container, a large display-font value, an optional trend line, and a
 * shimmer loading state via {@link ProviderSkeleton}.
 *
 * Structure (top → bottom):
 * 1. 2 px tone-coloured top border accent
 * 2. Soft circular icon in tone-tinted container  +  label on the same row
 * 3. Large display-font value
 * 4. Optional trend annotation
 *
 * Entrance animation: `.provider-fade-up` (suppressed on prefers-reduced-motion).
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@shared/lib/utils";
import { ProviderCard } from "./ProviderCard";
import { ProviderSkeleton } from "./ProviderSkeleton";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Colour tone that tints the icon container and top-border accent.
 * Maps to the semantic colour scale declared in globals.css `@theme`.
 */
export type StatCardTone = "brand" | "success" | "warning" | "info" | "neutral";

/** Props for {@link ProviderStatCard}. */
export interface ProviderStatCardProps {
  /** Short metric label (e.g. "المنتجات النشطة"). */
  label: string;
  /** Metric value — number, formatted string, or any React node. */
  value: ReactNode;
  /**
   * Icon element rendered in the tone-tinted container.
   * Size at `h-5 w-5` — the container is fixed at 40×40 px.
   */
  icon: ReactNode;
  /**
   * Colour tone applied to the icon bg and top-border accent.
   * @default "neutral"
   */
  tone?: StatCardTone;
  /**
   * Trend annotation below the value (e.g. "+12% مقارنة بالشهر الماضي").
   * Purely presentational — no semantic direction enforced by this primitive.
   */
  trend?: string;
  /** Show a shimmer skeleton instead of real content while data loads. */
  loading?: boolean;
  /** Extra Tailwind / CSS classes on the card root. */
  className?: string;
}

// ── Tone colour maps ──────────────────────────────────────────────────────────

const ICON_CLASSES: Record<StatCardTone, string> = {
  brand:   "bg-[var(--color-brand-50)]   text-[var(--color-brand-500)]",
  success: "bg-[var(--color-success-50)] text-[var(--color-success-500)]",
  warning: "bg-[var(--color-warning-50)] text-[var(--color-warning-500)]",
  info:    "bg-[var(--color-info-50)]    text-[var(--color-info-500)]",
  neutral: "bg-[var(--color-surface-2)]  text-[var(--color-muted)]",
};

// Inline-style border to avoid Tailwind arbitrary-value class permutations
// that may not be seen at build time when the key is dynamic.
const ACCENT_COLOR: Record<StatCardTone, string> = {
  brand:   "var(--color-brand-500)",
  success: "var(--color-success-500)",
  warning: "var(--color-warning-500)",
  info:    "var(--color-info-500)",
  neutral: "var(--color-divider)",
};

// ── Component ─────────────────────────────────────────────────────────────────

/** Provider KPI card with tone accent, loading skeleton, and entrance animation. */
export function ProviderStatCard({
  label,
  value,
  icon,
  tone = "neutral",
  trend,
  loading = false,
  className,
}: ProviderStatCardProps) {
  if (loading) {
    return (
      <ProviderCard className={cn("space-y-4", className)}>
        <div className="flex items-center gap-3">
          <ProviderSkeleton variant="circle" width={40} height={40} />
          <ProviderSkeleton variant="line" width="55%" height={14} />
        </div>
        <ProviderSkeleton variant="block" width="40%" height={32} />
        <ProviderSkeleton variant="line" width="50%" height={12} />
      </ProviderCard>
    );
  }

  const accentStyle: CSSProperties = {
    borderTop: `2px solid ${ACCENT_COLOR[tone]}`,
  };

  return (
    <ProviderCard
      className={cn("space-y-4 provider-fade-up", className)}
      style={accentStyle}
    >
      {/* Icon + label ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            ICON_CLASSES[tone],
          )}
          aria-hidden
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-[var(--color-ink-secondary)]">
          {label}
        </span>
      </div>

      {/* Value + trend ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <span
          className={cn(
            "font-[var(--font-display)] text-3xl font-bold leading-none",
            "text-[var(--color-ink-body)]",
          )}
        >
          {value}
        </span>

        {trend && (
          <span className="text-xs text-[var(--color-muted)]">{trend}</span>
        )}
      </div>
    </ProviderCard>
  );
}
