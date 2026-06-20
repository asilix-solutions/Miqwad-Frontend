/**
 * @file ProviderSkeleton.tsx
 *
 * Shimmer skeleton placeholder for the provider design-system.
 * Uses the `provider-shimmer` keyframe (defined in globals.css) with
 * provider surface tokens for the gradient.  Compose multiple instances
 * to build loading layouts that mirror real content shapes.
 *
 * Animation is automatically suppressed when the user prefers reduced motion
 * (see the `@media (prefers-reduced-motion)` guard in globals.css).
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { CSSProperties } from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape variant for {@link ProviderSkeleton}. */
export type SkeletonVariant = "line" | "block" | "circle";

/** Props for {@link ProviderSkeleton}. */
export interface ProviderSkeletonProps {
  /** Extra Tailwind / CSS classes (e.g. `"mb-2"`). */
  className?: string;
  /**
   * - `"line"`   — narrow inline placeholder (default h: 14 px, w: 100%)
   * - `"block"`  — rectangular area placeholder (default h: 48 px, w: 100%)
   * - `"circle"` — circular icon/avatar placeholder (default 40×40 px)
   * @default "line"
   */
  variant?: SkeletonVariant;
  /** Width as a CSS string (`"60%"`, `"120px"`) or pixel number. */
  width?: string | number;
  /** Height as a CSS string or pixel number. */
  height?: string | number;
}

// ── Per-variant defaults ──────────────────────────────────────────────────────

const VARIANT_META: Record<SkeletonVariant, { defaultH: string; defaultW: string; rounded: string }> = {
  line:   { defaultH: "14px", defaultW: "100%", rounded: "rounded-full" },
  block:  { defaultH: "48px", defaultW: "100%", rounded: "rounded-[var(--radius-sm)]" },
  circle: { defaultH: "40px", defaultW: "40px", rounded: "rounded-full" },
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider shimmer skeleton.
 *
 * The shimmer moves a linear-gradient (surface-2 → divider → surface-2)
 * horizontally via `background-position`, giving a polished loading effect
 * that matches the provider surface palette exactly.
 */
export function ProviderSkeleton({
  className,
  variant = "line",
  width,
  height,
}: ProviderSkeletonProps) {
  const meta = VARIANT_META[variant];

  const resolvedW =
    width === undefined
      ? meta.defaultW
      : typeof width === "number"
      ? `${width}px`
      : width;

  const resolvedH =
    height === undefined
      ? meta.defaultH
      : typeof height === "number"
      ? `${height}px`
      : height;

  const shimmerStyle: CSSProperties = {
    width: resolvedW,
    height: resolvedH,
    background:
      "linear-gradient(90deg, var(--color-surface-2) 0%, var(--color-divider) 50%, var(--color-surface-2) 100%)",
    backgroundSize: "200% 100%",
    animation: "provider-shimmer var(--dur-slow) linear infinite",
  };

  return (
    <span
      role="presentation"
      aria-hidden
      className={cn("block", meta.rounded, className)}
      style={shimmerStyle}
    />
  );
}
