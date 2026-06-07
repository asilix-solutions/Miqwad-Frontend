/**
 * @file OnboardingLoadingPage.tsx
 *
 * Full-height centered loading screen shown as the very first onboarding
 * step.  It renders the `<StripperLoader />` within the `OnboardingLayout`
 * (the stepper shows step 1 reached, all other nodes still dashed).
 *
 * On mount it fires the `useAccountSummary` query (or a minimum-duration
 * timer — whichever finishes **last**) and then navigates to the account
 * step (`/provider/onboarding/account`, replace) when the data is ready.
 *
 * Accessibility:
 *  - `role="status"` + `aria-live="polite"` on the wrapper so screen
 *    readers announce the loading state.
 *  - Visually-hidden i18n label (`providers.onboarding.loading.preparingAccount`).
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StripperLoader } from "../components/StripperLoader";
import { useAccountSummary } from "../hooks/useAccountSummary";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum display time (ms) so the animation is visible even on fast loads. */
const MIN_DISPLAY_MS = 1_800;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingLoadingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isSuccess } = useAccountSummary();

  /** Tracks whether the minimum-display timer has elapsed. */
  const timerDone = useRef(false);
  /** Prevents double-navigation in strict-mode double-render. */
  const navigated = useRef(false);

  // Kick off the minimum-display timer once on mount.
  useEffect(() => {
    const id = window.setTimeout(() => {
      timerDone.current = true;
    }, MIN_DISPLAY_MS);

    return () => window.clearTimeout(id);
  }, []);

  // Navigate when *both* conditions are met.
  useEffect(() => {
    if (!isSuccess || navigated.current) return;

    const tryNavigate = () => {
      if (navigated.current) return;
      navigated.current = true;
      void navigate("/provider/onboarding/account", { replace: true });
    };

    if (timerDone.current) {
      tryNavigate();
    } else {
      // Wait for the remaining time on the minimum-display timer.
      const id = window.setTimeout(tryNavigate, MIN_DISPLAY_MS);
      return () => window.clearTimeout(id);
    }
  }, [isSuccess, data, navigate]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "1 1 auto",
        minHeight: "60vh",
      }}
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

      <StripperLoader />
    </div>
  );
}
