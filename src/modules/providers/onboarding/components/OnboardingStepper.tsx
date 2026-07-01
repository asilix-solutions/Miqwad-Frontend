/**
 * @file OnboardingStepper.tsx
 *
 * Horizontal 4-step stepper for the provider onboarding flow.
 *
 * Visual spec (matching designer screenshots):
 *  - 4 nodes numbered 1–4, laid out right-to-left in RTL reading order
 *    (step 1 is the right-most node).
 *  - Steps complete from right → left. Completed nodes show a solid
 *    orange circle with a white check icon. The active node shows an
 *    orange ring. Upcoming nodes are dashed-border circles with their
 *    step number.
 *  - Connector lines between nodes: orange (filled) up to the reached
 *    progress, divider color beyond.
 *
 * Pure presentational — no routing or side effects.
 */

import { Check } from "lucide-react";
import type { OnboardingStepKey } from "../types";

// ---------------------------------------------------------------------------
// Step key → 1-based index mapping
// ---------------------------------------------------------------------------

const STEP_KEYS: readonly OnboardingStepKey[] = [
  "account",   // step 1 (right-most in RTL)
  "services",  // step 2
  "documents", // step 3
  "review",    // step 4
] as const;

/** Maps a step key to a 1-based step number (1 = first / right-most). */
function stepKeyToIndex(key: OnboardingStepKey): OnboardingStep {
  const idx = STEP_KEYS.indexOf(key);
  if (idx === -1) return 0; // loading or unknown → pre-step
  return (idx + 1) as OnboardingStep;
}

export type OnboardingStep = 0 | 1 | 2 | 3 | 4;

export interface OnboardingStepperProps {
  /** Current active step — either as a numeric index or a typed step key. */
  currentStep: OnboardingStep | OnboardingStepKey;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  const activeIndex: OnboardingStep =
    typeof currentStep === "number" ? currentStep : stepKeyToIndex(currentStep);

  // Render 4 nodes interspersed with 3 connectors.
  // The container uses dir="rtl" so flex-direction:row lays them out
  // right-to-left — step 1 appears at inline-start (right side in RTL).
  const nodes = [1, 2, 3, 4] as const;

  return (
    <div
      dir="rtl"
      className="flex w-full items-center bg-[var(--color-surface)] px-[var(--space-6)] py-[var(--space-4)]"
      role="navigation"
      aria-label="onboarding progress"
      style={{ fontFamily: "var(--font-main)" }}
    >
      {nodes.map((stepNum, idx) => {
        const isCompleted = stepNum < activeIndex;
        const isActive = stepNum === activeIndex;

        return (
          <div
            key={stepNum}
            className="flex items-center"
            style={{ flex: idx < nodes.length - 1 ? 1 : undefined }}
          >
            {/* ── Node ─────────────────────────────────────────────── */}
            <StepNode
              number={stepNum}
              state={isCompleted ? "completed" : isActive ? "active" : "upcoming"}
            />

            {/* ── Connector line (between nodes, not after the last) ── */}
            {idx < nodes.length - 1 && (
              <ConnectorLine
                filled={stepNum < activeIndex}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StepNode
// ---------------------------------------------------------------------------

type NodeState = "completed" | "active" | "upcoming";

interface StepNodeProps {
  number: number;
  state: NodeState;
}

function StepNode({ number, state }: StepNodeProps) {
  const size = 32;

  const baseStyles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: "var(--txt-caption)",
    fontWeight: 600,
    fontFamily: "var(--font-main)",
    transition: "all 0.3s ease",
  };

  switch (state) {
    case "completed":
      return (
        <div
          style={{
            ...baseStyles,
            backgroundColor: "var(--color-brand-orange)",
            color: "#fff",
          }}
          aria-label={`Step ${number} completed`}
        >
          <Check size={16} strokeWidth={3} />
        </div>
      );
    case "active":
      return (
        <div
          style={{
            ...baseStyles,
            border: "2px solid var(--color-brand-orange)",
            color: "var(--color-brand-orange)",
            backgroundColor: "transparent",
          }}
          aria-label={`Step ${number} active`}
          aria-current="step"
        >
          {number}
        </div>
      );
    case "upcoming":
    default:
      return (
        <div
          style={{
            ...baseStyles,
            border: "2px dashed var(--color-muted)",
            color: "var(--color-muted)",
            backgroundColor: "transparent",
          }}
          aria-label={`Step ${number} upcoming`}
        >
          {number}
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// ConnectorLine
// ---------------------------------------------------------------------------

interface ConnectorLineProps {
  /** Whether this connector is fully filled (orange) or unfilled (divider). */
  filled: boolean;
}

function ConnectorLine({ filled }: ConnectorLineProps) {
  return (
    <div
      style={{
        flex: 1,
        height: 2,
        marginInlineStart: "var(--space-2)",
        marginInlineEnd: "var(--space-2)",
        backgroundColor: filled
          ? "var(--color-brand-orange)"
          : "var(--color-divider)",
        borderRadius: 1,
        transition: "background-color 0.3s ease",
      }}
      aria-hidden
    />
  );
}
