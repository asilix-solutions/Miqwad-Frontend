/**
 * @file StripperLoader.tsx
 *
 * Animated loading indicator for the provider onboarding flow.
 *
 * Visual: a navy-blue rounded pill/bar flanked by two orange dots arranged
 * in a horizontal centered line. The pill travels back and forth between
 * the dots in a seamless loop. On each arrival:
 *   1) Color swap — the pill and the touched dot exchange colors (smooth).
 *   2) Dot bounce — the arrival-side dot scales up ~1.4× then springs back.
 *
 * Colors:
 *  - Navy: var(--color-brand-blue)  (#043168)
 *  - Orange: var(--color-brand-orange) (#F45E2B)
 *
 * Accessibility:
 *  - Wrapped in `role="status"` `aria-live="polite"` with a visually-hidden
 *    i18n loading label (`providers.onboarding.loading.preparingAccount`).
 *  - Respects `prefers-reduced-motion: reduce` — shows static elements only.
 *
 * Performance:
 *  - Animates ONLY `transform` (translateX for pill, scale for dots) and
 *    `background-color` (for the color swap).
 *  - `will-change: transform` on all animated elements for compositor promotion.
 *
 * Props:
 *  - `scale` — multiplier applied to the default sizing (default pill ≈ 60 px wide).
 */

import { type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StripperLoaderProps {
  /** Size multiplier — 1 ≈ 60 px pill width. */
  scale?: number;
}

// ---------------------------------------------------------------------------
// Scoped keyframe styles (injected once via <style>)
// ---------------------------------------------------------------------------

/**
 * Every class / animation name is prefixed with `sl-` (stripper-loader) to
 * avoid collisions with global styles.
 *
 * CSS custom properties used:
 *  --color-brand-blue   (#043168) — navy
 *  --color-brand-orange (#F45E2B) — orange
 *
 * Animation timeline (2s total, seamless loop):
 *
 *  0%    Pill at LEFT dot.  Pill = orange, leftDot = navy, rightDot = orange.
 *        Left dot is at peak bounce (1.4×), starting spring-back.
 *  7%    Left dot spring-back overshoot (0.92×). Pill still orange.
 *  10%   Left dot settles (1.0×). Pill starts transitioning back to navy.
 *  15%   Pill = navy, leftDot = orange. Pill in transit toward right.
 *  40%   Pill approaching right side, starts transitioning to orange.
 *        Right dot starts transitioning to navy.
 *  50%   Pill at RIGHT dot. Pill = orange, rightDot = navy, leftDot = orange.
 *        Right dot at peak bounce (1.4×).
 *  57%   Right dot spring-back overshoot (0.92×).
 *  60%   Right dot settles (1.0×). Pill starts transitioning back to navy.
 *  65%   Pill = navy, rightDot = orange. Pill in transit toward left.
 *  90%   Pill approaching left side, starts transitioning to orange.
 *        Left dot starts transitioning to navy.
 *  100%  Same as 0% — seamless.
 */
const STYLES = `
/* ── Pill: horizontal travel + color swap ──────────────────────────── */
@keyframes sl-pill-travel {
  0% {
    transform: translateX(calc(var(--sl-travel) * -1));
    background-color: var(--color-brand-orange);
  }
  5% {
    transform: translateX(calc(var(--sl-travel) * -0.85));
    background-color: var(--color-brand-orange);
  }
  18% {
    transform: translateX(calc(var(--sl-travel) * -0.4));
    background-color: var(--color-brand-blue);
  }
  25% {
    transform: translateX(0);
    background-color: var(--color-brand-blue);
  }
  35% {
    transform: translateX(calc(var(--sl-travel) * 0.55));
    background-color: var(--color-brand-blue);
  }
  48% {
    transform: translateX(calc(var(--sl-travel) * 0.92));
    background-color: var(--color-brand-orange);
  }
  50% {
    transform: translateX(var(--sl-travel));
    background-color: var(--color-brand-orange);
  }
  55% {
    transform: translateX(calc(var(--sl-travel) * 0.85));
    background-color: var(--color-brand-orange);
  }
  68% {
    transform: translateX(calc(var(--sl-travel) * 0.4));
    background-color: var(--color-brand-blue);
  }
  75% {
    transform: translateX(0);
    background-color: var(--color-brand-blue);
  }
  85% {
    transform: translateX(calc(var(--sl-travel) * -0.55));
    background-color: var(--color-brand-blue);
  }
  98% {
    transform: translateX(calc(var(--sl-travel) * -0.92));
    background-color: var(--color-brand-orange);
  }
  100% {
    transform: translateX(calc(var(--sl-travel) * -1));
    background-color: var(--color-brand-orange);
  }
}

/* ── Left dot: bounce at 0%/100%, color swap ──────────────────────── */
@keyframes sl-dot-left {
  0% {
    transform: scale(1.18);
    background-color: var(--color-brand-blue);
  }
  8% {
    transform: scale(1);
    background-color: var(--color-brand-blue);
  }
  18% {
    transform: scale(1);
    background-color: var(--color-brand-blue);
  }
  40% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  50% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  85% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  98% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }

  100% {
    transform: scale(1.18);
    background-color: var(--color-brand-blue);
  }
}

/* ── Right dot: bounce at 50%, color swap ─────────────────────────── */
@keyframes sl-dot-right {
  0% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  10% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  35% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  48% {
    transform: scale(1);
    background-color: var(--color-brand-blue);
  }
  50% {
    transform: scale(1.18);
    background-color: var(--color-brand-blue);
  }
  58% {
    transform: scale(1);
    background-color: var(--color-brand-blue);
  }

  68% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  90% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
  100% {
    transform: scale(1);
    background-color: var(--color-brand-orange);
  }
}

/* ── Pill class ───────────────────────────────────────────────────── */
.sl-pill {
  will-change: transform;
  transform-origin: center;
  animation: sl-pill-travel 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* ── Dot classes ─────────────────────────────────────────────────── */
.sl-dot-left {
  will-change: transform;
  transform-origin: center;
  animation: sl-dot-left 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.sl-dot-right {
  will-change: transform;
  transform-origin: center;
  animation: sl-dot-right 2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

/* ── Reduced-motion override ──────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .sl-pill {
    animation: none !important;
    transform: none !important;
    background-color: var(--color-brand-blue) !important;
  }
  .sl-dot-left,
  .sl-dot-right {
    animation: none !important;
    transform: none !important;
    background-color: var(--color-brand-orange) !important;
  }
}
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StripperLoader({ scale = 1 }: StripperLoaderProps) {
  const { t } = useTranslation();

  // Dimensions (before scale).
  const pillWidth = 60 * scale;
  const pillHeight = 16 * scale;
  const pillRadius = pillHeight / 2;

  const dotSize = 14 * scale;

  const gap = 10 * scale;

  // In the flex layout:  [dot(14)] [gap(10)] [pill(60)] [gap(10)] [dot(14)]
  // Pill natural center is at: dotSize + gap + pillWidth/2
  // Left dot center is at: dotSize/2
  // Right dot center is at: dotSize + gap + pillWidth + gap + dotSize/2
  // Travel distance from pill center to a dot center:
  //   = (dotSize + gap + pillWidth/2) - (dotSize/2)
  //   = dotSize/2 + gap + pillWidth/2
  const travelDistance =( dotSize / 2 + gap + pillWidth / 2)* 0.5;

  // Total container width: dot + gap + pill + gap + dot
  const totalWidth = dotSize + gap + pillWidth + gap + dotSize;
  const totalHeight = Math.max(pillHeight, dotSize);

  // Container style — centers the loader.
  const containerStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: gap,
    position: "relative",
    width: totalWidth,
    height: totalHeight,
  };

  // Pill style. The `--sl-travel` var drives the animation travel distance.
  const pillStyle: CSSProperties = {
    width: pillWidth,
    height: pillHeight,
    borderRadius: pillRadius,
    backgroundColor: "var(--color-brand-blue)",
    flexShrink: 0,
    position: "relative",
    ["--sl-travel" as string]: `${travelDistance}px`,
  };

  // Dot style factory.
  const dotBaseStyle: CSSProperties = {
    width: dotSize,
    height: dotSize,
    borderRadius: "50%",
    backgroundColor: "var(--color-brand-orange)",
    flexShrink: 0,
  };

  return (
    <>
      {/* Inject scoped keyframes — React deduplicates identical <style> tags. */}
      <style>{STYLES}</style>

      <div
        role="status"
        aria-live="polite"
        style={containerStyle}
      >
        {/* Visually-hidden accessible label */}
        <span
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          {t("providers.onboarding.loading.preparingAccount")}
        </span>

        {/* Left orange dot */}
        <div
          className="sl-dot-left"
          style={dotBaseStyle}
          aria-hidden="true"
        />

        {/* Navy pill */}
        <div className="sl-pill" style={pillStyle} aria-hidden="true" />

        {/* Right orange dot */}
        <div
          className="sl-dot-right"
          style={dotBaseStyle}
          aria-hidden="true"
        />
      </div>
    </>
  );
}
