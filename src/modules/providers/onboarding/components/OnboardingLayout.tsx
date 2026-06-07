/**
 * @file OnboardingLayout.tsx
 *
 * Shared layout shell for the provider onboarding flow.
 *
 * Renders:
 *  1. `<OnboardingStepper>` at the top, deriving `currentStep` from the
 *     matched child route's `handle.onboardingStep` (typed via `RouteHandle`).
 *  2. `<Outlet />` for the active step page.
 *  3. A "skip temporarily" link at the bottom-start corner that navigates
 *     to `/app/dashboard` (replace).
 *
 * This component sits *above* the Suspense boundary for child routes, so
 * it must not depend on lazy-loaded child content being present.
 */

import { Outlet, useMatches, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { OnboardingStepper } from "./OnboardingStepper";
import type { OnboardingStepKey } from "../types";
import type { OnboardingStep } from "./OnboardingStepper";

// ---------------------------------------------------------------------------
// Route handle typing
// ---------------------------------------------------------------------------

/**
 * Each onboarding child route should export a `handle` object conforming to
 * this shape so the layout can derive the current step.
 *
 * Example route definition (next prompt):
 * ```ts
 * { path: "account", element: <AccountPage />, handle: { onboardingStep: "account" } }
 * ```
 */
export interface OnboardingRouteHandle {
  onboardingStep: OnboardingStepKey;
}

/** Type guard for route match handles. */
function isOnboardingHandle(handle: unknown): handle is OnboardingRouteHandle {
  return (
    typeof handle === "object" &&
    handle !== null &&
    "onboardingStep" in handle &&
    typeof (handle as OnboardingRouteHandle).onboardingStep === "string"
  );
}

/** Maps step keys to their numeric index. */
const STEP_INDEX_MAP: Record<OnboardingStepKey, OnboardingStep> = {
  loading: 0,
  account: 1,
  documents: 2,
  review: 3,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const matches = useMatches();

  // Walk the matched routes bottom-up to find the deepest onboarding handle.
  const currentStep = deriveCurrentStep(matches);

  const isLoadingStep = currentStep === 0;

  const handleSkip = () => {
    void navigate("/app/dashboard", { replace: true });
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        backgroundColor: "var(--color-app-bg)",
        fontFamily: "var(--font-main)",
      }}
    >
      {/* ── Top stepper bar ─────────────────────────────────────────────── */}
      {!isLoadingStep && <OnboardingStepper currentStep={currentStep} />}

      {/* ── Page content (child route) ──────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-y-auto" style={{ minHeight: 0 }}>
        <Outlet />
      </main>

      {/* ── Skip control — bottom-start ─────────────────────────────────── */}
      {!isLoadingStep && (
        <div
          style={{
            position: "fixed",
            bottom: "var(--space-6)",
            insetInlineStart: "var(--space-6)",
          }}
        >
          <button
            type="button"
            onClick={handleSkip}
            className="txt-body"
            style={{
              color: "var(--color-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-main)",
              textDecoration: "underline",
              textDecorationColor: "transparent",
              textUnderlineOffset: "3px",
              transition: "text-decoration-color 0.2s ease",
              padding: "var(--space-2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecorationColor = "var(--color-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecorationColor = "transparent";
            }}
          >
            {t("providers.onboarding.loading.skipTemp")}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives the current onboarding step from the matched route tree.
 *
 * Walks the `useMatches()` results in reverse to find the deepest route that
 * has a `handle.onboardingStep` property. Falls back to step 1 ("account")
 * when no handle is found (e.g. while a child route is lazy-loading).
 */
function deriveCurrentStep(
  matches: ReturnType<typeof useMatches>,
): OnboardingStep {
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (isOnboardingHandle(match.handle)) {
      return STEP_INDEX_MAP[match.handle.onboardingStep];
    }
  }
  // Fallback — child not yet loaded or no handle defined.
  return 1;
}
