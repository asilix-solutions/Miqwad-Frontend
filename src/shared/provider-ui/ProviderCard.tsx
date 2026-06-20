/**
 * @file ProviderCard.tsx
 *
 * Base surface container for the provider design-system.
 * Replaces raw `<div>` wrappers in provider dashboards with a consistently
 * elevated, warm card that respects provider shadow and motion tokens.
 *
 * Design intent (provider vs. admin):
 * - Larger radius: `--radius-lg` (20 px) vs admin's `--radius-md` (16 px)
 * - Soft layered shadow: `--shadow-provider-sm`, not a flat border
 * - Interactive variant lifts –0.5 (2 px) with a warm brand-tinted shadow
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import type { ComponentPropsWithoutRef, CSSProperties, ElementType, ReactNode } from "react";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderCard}. */
export type ProviderCardProps = {
  /** Card content. */
  children: ReactNode;
  /** Additional Tailwind / CSS classes merged via `cn`. */
  className?: string;
  /**
   * Adds hover-lift (translateY −2 px) + brand-tinted shadow on hover.
   * Transition uses `--dur-base` and `--ease-provider` motion tokens.
   * @default false
   */
  interactive?: boolean;
  /**
   * Applies `p-6` (24 px) inner padding.
   * Disable for cards with custom inner layout (e.g. full-bleed images).
   * @default true
   */
  padded?: boolean;
  /**
   * Polymorphic element swap.  Props are typed as `div` attributes; for
   * custom components cast at the call-site if needed.
   * @default "div"
   */
  as?: ElementType;
} & Omit<ComponentPropsWithoutRef<"div">, "as">;

// ── Component ─────────────────────────────────────────────────────────────────

/** Provider design-system surface container. */
export function ProviderCard({
  children,
  className,
  interactive = false,
  padded = true,
  as: Tag = "div",
  style,
  ...rest
}: ProviderCardProps) {
  // Narrowed to "div" so TypeScript accepts the `rest` spread correctly.
  // At runtime `Tag` is whatever the caller passed — the cast is type-only.
  const Comp = Tag as unknown as "div";

  const interactiveStyle: CSSProperties = interactive
    ? {
        transition: [
          "transform var(--dur-base) var(--ease-provider)",
          "box-shadow var(--dur-base) var(--ease-provider)",
        ].join(", "),
      }
    : {};

  return (
    <Comp
      className={cn(
        "bg-[var(--color-surface)]",
        "rounded-[var(--radius-lg)]",
        "shadow-[var(--shadow-provider-sm)]",
        padded && "p-6",
        interactive && [
          "cursor-pointer",
          "hover:-translate-y-0.5",
          "hover:shadow-[var(--shadow-provider-hover)]",
        ],
        className,
      )}
      style={{ ...interactiveStyle, ...style }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
