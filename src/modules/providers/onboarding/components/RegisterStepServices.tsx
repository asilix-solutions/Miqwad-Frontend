/**
 * @file RegisterStepServices.tsx
 *
 * Provider onboarding "Services / Specialisations" screen (step 2).
 *
 * Layout:
 *  - Title + subtitle.
 *  - CategoryMultiSelectTree scoped to the provider's type (workshop / dealer / scrap).
 *    Providers pick one or more category branches they serve.
 *  - Selected-count summary chip.
 *  - Primary CTA → /provider/onboarding/documents.
 *  - Back link → /provider/onboarding/account.
 *
 * States handled:
 *  - Loading: skeleton rows with pulse animation.
 *  - Error: retry-friendly fallback.
 *  - Empty: "no categories" handled by CategoryMultiSelectTree internally.
 *
 * Selection model: independent checkboxes — no auto-cascade between parent/child.
 * categoryIds: number[] is preserved exactly as sent to the backend.
 *
 * Route handle: `{ onboardingStep: "services" }` — consumed by OnboardingLayout
 * to position the stepper at step 2.
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, RotateCcw, ArrowRight } from "lucide-react";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import { useAccountSummary } from "../hooks/useAccountSummary";
import { CategoryMultiSelectTree } from "@shared/provider-ui/CategoryMultiSelectTree";
import { Button } from "@/components/ui/button";
import { servicesStepSchema, type ServicesStepValues } from "../schemas/onboarding.schemas";
import type { OnboardingStepKey } from "../types";

// ---------------------------------------------------------------------------
// Route handle
// ---------------------------------------------------------------------------

export const handle: { onboardingStep: OnboardingStepKey } = {
  onboardingStep: "services",
};

// ---------------------------------------------------------------------------
// Skeleton (loading state)
// ---------------------------------------------------------------------------

const SKELETON_STYLES = `
@keyframes svcSkeletonPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

function SkeletonSection() {
  return (
    <div
      style={{
        border: "1px solid var(--color-divider)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          backgroundColor: "var(--color-surface-2)",
          padding: "var(--space-3) var(--space-4)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            backgroundColor: "var(--color-divider)",
            animation: "svcSkeletonPulse 1.5s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <div
          style={{
            width: "45%",
            height: 14,
            borderRadius: "var(--radius-xs)",
            backgroundColor: "var(--color-divider)",
            animation: "svcSkeletonPulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          padding: "var(--space-2) var(--space-4)",
          backgroundColor: "var(--color-surface)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
        }}
      >
        {[0.55, 0.4, 0.5].map((w, i) => (
          <div
            key={i}
            style={{
              width: `${w * 100}%`,
              height: 12,
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--color-divider)",
              animation: "svcSkeletonPulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
              marginInlineStart: 28,
            }}
          />
        ))}
      </div>
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
        <AlertTriangle size={28} style={{ color: "var(--color-danger-500)" }} aria-hidden />
      </div>
      <p className="txt-body" style={{ color: "var(--color-ink-body)", fontWeight: 600 }}>
        {t("common.errorTitle")}
      </p>
      <p className="txt-caption" style={{ color: "var(--color-muted)" }}>
        {t("errors.networkSubtitle")}
      </p>
      <Button variant="primary" size="md" onClick={onRetry}>
        <RotateCcw size={16} aria-hidden />
        {t("common.retry")}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RegisterStepServices() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const categoriesQ = useServiceCategoriesQuery();
  const summaryQ = useAccountSummary();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<ServicesStepValues>({
    resolver: zodResolver(servicesStepSchema),
    defaultValues: { categoryIds: [] },
  });

  const selectedIds = watch("categoryIds");

  const isLoading = categoriesQ.isLoading || summaryQ.isLoading;
  const isError = categoriesQ.isError || summaryQ.isError;

  const handleRetry = useCallback(() => {
    void categoriesQ.refetch();
    void summaryQ.refetch();
  }, [categoriesQ, summaryQ]);

  const onSubmit = useCallback(
    (_data: ServicesStepValues) => {
      // TODO: persist categoryIds to backend (POST /onboarding/services)
      void navigate("/provider/onboarding/documents");
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    void navigate("/provider/onboarding/account");
  }, [navigate]);

  if (isError) {
    return <ErrorFallback onRetry={handleRetry} />;
  }

  const providerType = summaryQ.data?.providerType ?? null;
  const categories = categoriesQ.data ?? [];

  const selectedCount = selectedIds.length;
  const isAr = i18n.language === "ar";

  const selectedSummary =
    selectedCount === 0
      ? null
      : selectedCount === 1
        ? (isAr ? "تصنيف واحد محدد" : "1 category selected")
        : (isAr ? `${selectedCount} تصنيفات محددة` : `${selectedCount} categories selected`);

  return (
    <>
      <style>{SKELETON_STYLES}</style>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBlockStart: "var(--space-10)",
          paddingBlockEnd: "var(--space-16)",
          paddingInline: "var(--space-6)",
          maxWidth: 680,
          marginInline: "auto",
          fontFamily: "var(--font-main)",
          gap: "var(--space-6)",
          width: "100%",
        }}
      >
        {/* ── Title + subtitle ──────────────────────────────────────────── */}
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
            style={{ fontWeight: 700, color: "var(--color-ink-body)", margin: 0 }}
          >
            {t("providers.onboarding.services.title")}
          </h1>
          <p
            className="txt-body"
            style={{ color: "var(--color-muted)", margin: 0, lineHeight: 1.6 }}
          >
            {t("providers.onboarding.services.subtitle")}
          </p>
        </div>

        {/* ── Category tree ─────────────────────────────────────────────── */}
        <div style={{ width: "100%" }}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <SkeletonSection />
              <SkeletonSection />
              <SkeletonSection />
            </div>
          ) : (
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <CategoryMultiSelectTree
                  categories={categories}
                  value={field.value}
                  onChange={field.onChange}
                  providerType={providerType}
                  error={
                    errors.categoryIds
                      ? t("providers.onboarding.services.noneSelected")
                      : undefined
                  }
                />
              )}
            />
          )}
        </div>

        {/* ── Selected summary chip ─────────────────────────────────────── */}
        {!isLoading && selectedSummary && (
          <div
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1)",
              borderRadius: "var(--radius-pill)",
              backgroundColor: "color-mix(in srgb, var(--color-brand-orange) 12%, transparent)",
              color: "var(--color-brand-orange)",
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--txt-caption)",
              fontWeight: 600,
            }}
          >
            {selectedSummary}
          </div>
        )}

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        {!isLoading && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              marginBlockStart: "var(--space-2)",
            }}
          >
            <Button variant="primary" size="lg" type="submit">
              {t("providers.onboarding.services.continue")}
            </Button>

            <button
              type="button"
              onClick={handleBack}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--color-muted)",
                fontFamily: "var(--font-main)",
                fontSize: "var(--txt-body)",
                padding: 0,
                alignSelf: "flex-end",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-ink-body)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-muted)";
              }}
            >
              <ArrowRight size={16} aria-hidden style={{ flexShrink: 0 }} />
              {t("providers.onboarding.services.back")}
            </button>
          </div>
        )}
      </form>
    </>
  );
}
