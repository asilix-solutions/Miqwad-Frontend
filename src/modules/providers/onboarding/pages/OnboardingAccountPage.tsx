/**
 * @file OnboardingAccountPage.tsx
 *
 * Provider onboarding "Account Summary" screen (step 1 complete).
 *
 * Layout:
 *  - Green success circle with a check icon at top.
 *  - Title + subtitle from i18n (`providers.onboarding.account.*`).
 *  - 2×2 grid of `AccountSummaryCard` showing account type, owner, email,
 *    and phone — values populated via `useAccountSummary()` (TanStack Query).
 *  - Primary CTA button navigating to `/provider/onboarding/documents`.
 *
 * States handled:
 *  - **Loading**: Skeleton placeholder cards + pulsing circle.
 *  - **Error**: Retry-friendly fallback using the project's error pattern
 *    (consistent with ErrorBoundary style) with query refetch.
 *  - **Empty/Success**: Full summary grid with data.
 *
 * Route handle: `{ onboardingStep: "account" }` — consumed by
 * `OnboardingLayout` to set the stepper to step 1 complete.
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, AlertTriangle, RotateCcw } from "lucide-react";
import { useAccountSummary } from "../hooks/useAccountSummary";
import { AccountSummaryCard } from "../components/AccountSummaryCard";
import { Button } from "@shared/components/ui/button";
import type { OnboardingStepKey } from "../types";

// ---------------------------------------------------------------------------
// Route handle — tells the OnboardingLayout which step we're on
// ---------------------------------------------------------------------------

export const handle: { onboardingStep: OnboardingStepKey } = {
  onboardingStep: "account",
};

// ---------------------------------------------------------------------------
// Skeleton card (loading placeholder)
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-card)",
        padding: "var(--space-5) var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      {/* Label skeleton */}
      <div
        style={{
          width: "40%",
          height: 12,
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--color-divider)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      {/* Value skeleton */}
      <div
        style={{
          width: "70%",
          height: 16,
          borderRadius: "var(--radius-xs)",
          backgroundColor: "var(--color-divider)",
          animation: "pulse 1.5s ease-in-out infinite",
          animationDelay: "0.15s",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton keyframe injection
// ---------------------------------------------------------------------------

const SKELETON_STYLES = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

// ---------------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------------

interface ErrorFallbackProps {
  onRetry: () => void;
}

function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-10)",
        textAlign: "center",
        fontFamily: "var(--font-main)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: "var(--color-danger-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AlertTriangle
          size={28}
          style={{ color: "var(--color-danger-500)" }}
          aria-hidden="true"
        />
      </div>

      <p
        className="txt-body"
        style={{
          color: "var(--color-ink-body)",
          fontWeight: 600,
        }}
      >
        {t("common.errorTitle")}
      </p>

      <p
        className="txt-caption"
        style={{ color: "var(--color-muted)" }}
      >
        {t("errors.networkSubtitle")}
      </p>

      <Button variant="primary" size="md" onClick={onRetry}>
        <RotateCcw size={16} aria-hidden="true" />
        {t("common.retry")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OnboardingAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAccountSummary();

  const handleContinue = () => {
    void navigate("/provider/onboarding/documents");
  };

  const handleRetry = () => {
    void refetch();
  };

  // ── Error state ───────────────────────────────────────────────────────
  if (isError) {
    return <ErrorFallback onRetry={handleRetry} />;
  }

  return (
    <>
      <style>{SKELETON_STYLES}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBlockStart: "var(--space-12)",
          paddingBlockEnd: "var(--space-16)",
          paddingInline: "var(--space-6)",
          maxWidth: 520,
          marginInline: "auto",
          fontFamily: "var(--font-main)",
          gap: "var(--space-8)",
        }}
      >
        {/* ── Success circle with check ─────────────────────────────── */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "var(--color-success-500)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(31, 157, 85, 0.25)",
          }}
          aria-hidden="true"
        >
          <Check size={36} strokeWidth={3} color="#fff" />
        </div>

        {/* ── Title + subtitle ──────────────────────────────────────── */}
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <h1
            className="txt-display-m"
            style={{
              fontWeight: 700,
              color: "var(--color-ink-body)",
              margin: 0,
            }}
          >
            {t("providers.onboarding.account.title")}
          </h1>

          <p
            className="txt-body"
            style={{
              color: "var(--color-muted)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {t("providers.onboarding.account.subtitle")}
          </p>
        </div>

        {/* ── 2×2 Summary grid ──────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-4)",
            width: "100%",
          }}
        >
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : data ? (
            <>
              <AccountSummaryCard
                label={t("providers.onboarding.account.accountType")}
                value={t("auth.register.providerOption")}
              />
              <AccountSummaryCard
                label={t("providers.onboarding.account.owner")}
                value={data.ownerName}
              />
              <AccountSummaryCard
                label={t("providers.onboarding.account.email")}
                value={data.email}
              />
              <AccountSummaryCard
                label={t("providers.onboarding.account.phone")}
                value={data.phone}
              />
            </>
          ) : (
            /* ── Empty / no-data fallback ─────────────────────────── */
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "var(--space-10)",
              }}
            >
              <p
                className="txt-body"
                style={{ color: "var(--color-muted)" }}
              >
                {t("empty.noData")}
              </p>
            </div>
          )}
        </div>

        {/* ── Primary CTA ───────────────────────────────────────────── */}
        <Button
          variant="primary"
          size="md"
          block
          onClick={handleContinue}
          disabled={isLoading || !data}
        >
          {t("providers.onboarding.account.continue")}
        </Button>
      </div>
    </>
  );
}
