/**
 * @file PlansCardGrid.tsx
 * @description Cards view for the admin Plans section — a responsive grid of
 * {@link PlanCard}s with matching skeleton and error states. Reads the same
 * `useSubscriptionPlans` data as {@link PlansTable} (no duplicate fetching);
 * the empty state is owned by the page and shared with the table view.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "../types";
import { PlanCard, PlanCardSkeleton } from "./PlanCard";

const SKELETON_COUNT = 6;

interface PlansCardGridProps {
  items: SubscriptionPlan[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleActive: (plan: SubscriptionPlan, isActive: boolean) => void;
  togglingId?: number | null;
}

export function PlansCardGrid({
  items,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onToggleActive,
  togglingId = null,
}: PlansCardGridProps) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-1)]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-danger-500)_10%,transparent)]">
          <AlertCircle className="h-9 w-9 text-[var(--color-danger-500)]" />
        </div>
        <span className="text-sm font-medium text-[var(--color-ink-body)]">
          {t("superAdmin.plans.errorTitle")}
        </span>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCw className="size-4" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <PlanCardSkeleton key={`plan-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          isToggling={togglingId === plan.id}
        />
      ))}
    </div>
  );
}
