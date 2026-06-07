/**
 * @file OnboardingReviewPage.tsx
 *
 * Provider onboarding "Review" screen (step 3).
 *
 * Layout (matching screenshot 4):
 *  - Top: soft-orange circle with a Clock icon (lucide).
 *  - Title + subtitle from i18n (`providers.onboarding.review.*`).
 *  - ReviewTimeline with 3 items fetched via `useReviewStatus()`.
 *  - Two action cards (grid): "راجع مستنداتك" and "اقرأ دليل التسعير",
 *    each with a lucide icon (FileText / Info). Cards are subtle outline
 *    surfaces.
 *  - Bottom pill button "دخول لوحة التحكّم بحالة معطّلة (تخطّي مؤقّت)"
 *    → navigates to /app/dashboard.
 *  - Stepper shows steps 1 & 2 complete (step 3 active).
 *
 * States handled:
 *  - **Loading**: Skeleton placeholder with pulse animation.
 *  - **Error**: Retry-friendly error fallback.
 *  - **Empty/Success**: Full timeline + action cards.
 *
 * Route handle: `{ onboardingStep: "review" }` — consumed by
 * `OnboardingLayout` to set the stepper to step 3 active.
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, FileText, Info, AlertTriangle, RotateCcw } from "lucide-react";
import { useReviewStatus } from "../hooks/useReviewStatus";
import { ReviewTimeline } from "../components/ReviewTimeline";
import { Button } from "@/components/ui/button";
import type { OnboardingStepKey } from "../types";

// ---------------------------------------------------------------------------
// Route handle — tells the OnboardingLayout which step we're on
// ---------------------------------------------------------------------------

export const handle: { onboardingStep: OnboardingStepKey } = {
  onboardingStep: "review",
};

// ---------------------------------------------------------------------------
// Skeleton (loading state)
// ---------------------------------------------------------------------------

const SKELETON_STYLES = `
@keyframes reviewSkeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

function SkeletonTimeline() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        width: "100%",
      }}
    >
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "var(--color-divider)",
              flexShrink: 0,
              animation: "reviewSkeletonPulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <div
              style={{
                width: "50%",
                height: 14,
                borderRadius: "var(--radius-xs)",
                backgroundColor: "var(--color-divider)",
                animation: "reviewSkeletonPulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
            <div
              style={{
                width: "35%",
                height: 10,
                borderRadius: "var(--radius-xs)",
                backgroundColor: "var(--color-divider)",
                animation: "reviewSkeletonPulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.15 + 0.1}s`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error fallback
// ---------------------------------------------------------------------------

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
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
        style={{ color: "var(--color-ink-body)", fontWeight: 600 }}
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
// Action Card
// ---------------------------------------------------------------------------

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
}

function ActionCard({ icon, title, hint }: ActionCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-6)",
        border: "1.5px solid var(--color-divider)",
        borderRadius: "var(--radius-md)",
        backgroundColor: "var(--color-surface)",
        textAlign: "center",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--color-brand-orange)";
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-divider)";
        e.currentTarget.style.boxShadow = "none";
      }}
      role="button"
      tabIndex={0}
    >
      <div
        style={{
          color: "var(--color-ink-body)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        {icon}
        <span
          className="txt-body"
          style={{ fontWeight: 600 }}
        >
          {title}
        </span>
      </div>
      <span
        className="txt-caption"
        style={{ color: "var(--color-muted)" }}
      >
        {hint}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OnboardingReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useReviewStatus();

  const handleEnterDashboard = () => {
    void navigate("/app/dashboard", { replace: true });
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
          maxWidth: 600,
          marginInline: "auto",
          fontFamily: "var(--font-main)",
          gap: "var(--space-8)",
        }}
      >
        {/* ── Clock circle ───────────────────────────────────────────── */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "var(--color-brand-orange-50, #FFF3E0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <Clock
            size={36}
            strokeWidth={2}
            style={{ color: "var(--color-brand-orange)" }}
          />
        </div>

        {/* ── Title + subtitle ───────────────────────────────────────── */}
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
            {t("providers.onboarding.review.title")}
          </h1>

          <p
            className="txt-body"
            style={{
              color: "var(--color-muted)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {t("providers.onboarding.review.subtitle")}
          </p>
        </div>

        {/* ── Review timeline ────────────────────────────────────────── */}
        <div style={{ width: "100%" }}>
          {isLoading ? (
            <SkeletonTimeline />
          ) : data && data.length > 0 ? (
            <ReviewTimeline items={data} />
          ) : (
            /* ── Empty fallback ────────────────────────────────────── */
            <div
              style={{
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

        {/* ── Action cards (2-column grid) ────────────────────────────── */}
        {!isLoading && data && data.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
              width: "100%",
            }}
          >
            <ActionCard
              icon={<FileText size={18} aria-hidden="true" />}
              title={t("providers.onboarding.review.reviewDocs")}
              hint={t("providers.onboarding.review.reviewDocsHint")}
            />
            <ActionCard
              icon={<Info size={18} aria-hidden="true" />}
              title={t("providers.onboarding.review.pricingGuide")}
              hint={t("providers.onboarding.review.pricingGuideHint")}
            />
          </div>
        )}

        {/* ── Skip / enter dashboard pill ─────────────────────────────── */}
        <div style={{ alignSelf: "flex-start" }}>
          <Button
            variant="outline"
            size="md"
            onClick={handleEnterDashboard}
            style={{
              borderRadius: "var(--radius-pill)",
              borderColor: "var(--color-brand-orange)",
              color: "var(--color-brand-orange)",
            }}
          >
            {t("providers.onboarding.review.enterDashboard")}
          </Button>
        </div>
      </div>
    </>
  );
}
