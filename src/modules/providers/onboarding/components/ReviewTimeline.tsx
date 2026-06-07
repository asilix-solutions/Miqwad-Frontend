/**
 * @file ReviewTimeline.tsx
 *
 * Vertical timeline component for the onboarding review screen.
 *
 * Each item renders:
 *  - A status circle:  done → green check,  active → orange "…" pulsing,
 *    pending → grey dash.
 *  - Title + subtitle text.
 *  - A vertical connector line (var(--color-divider)) between items.
 *
 * Pure presentational — no side effects or routing.
 */

import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReviewTimelineItem } from "../types";

// ---------------------------------------------------------------------------
// Pulse animation for the active node
// ---------------------------------------------------------------------------

const PULSE_KEYFRAMES = `
@keyframes reviewTimelinePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
`;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReviewTimelineProps {
  items: ReviewTimelineItem[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewTimeline({ items }: ReviewTimelineProps) {
  const { t } = useTranslation();

  return (
    <>
      <style>{PULSE_KEYFRAMES}</style>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          width: "100%",
          fontFamily: "var(--font-main)",
        }}
        role="list"
        aria-label="review timeline"
      >
        {items.map((item, idx) => (
          <div key={item.id} role="listitem">
            {/* ── Row: circle + text ──────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-4)",
              }}
            >
              <StatusCircle state={item.state} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-1)",
                  flex: 1,
                }}
              >
                <span
                  className="txt-body"
                  style={{
                    fontWeight: 600,
                    color:
                      item.state === "pending"
                        ? "var(--color-muted)"
                        : "var(--color-ink-body)",
                  }}
                >
                  {t(item.titleKey)}
                </span>
                {item.subtitleKey && (
                  <span
                    className="txt-caption"
                    style={{
                      color:
                        item.state === "active"
                          ? "var(--color-brand-orange)"
                          : "var(--color-muted)",
                      fontWeight: item.state === "active" ? 500 : 400,
                    }}
                  >
                    {t(item.subtitleKey)}
                  </span>
                )}
              </div>
            </div>

            {/* ── Connector line (not after last item) ────────────── */}
            {idx < items.length - 1 && (
              <div
                style={{
                  width: 2,
                  height: 28,
                  backgroundColor: "var(--color-divider)",
                  marginInlineStart: 15, // centers under the 32px circle
                  borderRadius: 1,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// StatusCircle
// ---------------------------------------------------------------------------

function StatusCircle({ state }: { state: ReviewTimelineItem["state"] }) {
  const size = 32;

  const baseStyles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.3s ease",
  };

  switch (state) {
    case "done":
      return (
        <div
          style={{
            ...baseStyles,
            backgroundColor: "var(--color-success-500)",
            color: "#fff",
          }}
          aria-label="completed"
        >
          <Check size={16} strokeWidth={3} />
        </div>
      );

    case "active":
      return (
        <div
          style={{
            ...baseStyles,
            backgroundColor: "var(--color-brand-orange)",
            color: "#fff",
            animation: "reviewTimelinePulse 2s ease-in-out infinite",
          }}
          aria-label="in progress"
        >
          {/* Three-dot ellipsis */}
          <svg
            width="18"
            height="6"
            viewBox="0 0 18 6"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="3" cy="3" r="2" />
            <circle cx="9" cy="3" r="2" />
            <circle cx="15" cy="3" r="2" />
          </svg>
        </div>
      );

    case "pending":
    default:
      return (
        <div
          style={{
            ...baseStyles,
            backgroundColor: "var(--color-divider)",
            color: "var(--color-muted)",
          }}
          aria-label="pending"
        >
          <Minus size={16} strokeWidth={2.5} />
        </div>
      );
  }
}
