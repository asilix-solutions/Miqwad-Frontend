/**
 * @file PlanCard.tsx
 * @description Visual card for one subscription plan, used in the cards view
 * of the admin Plans section. Renders the same {@link SubscriptionPlan}
 * view-model consumed by {@link PlansTable} — one source of truth so a future
 * field surfaces in both views with a one-line change. Lifecycle is limited to
 * activate/deactivate (the only plan mutation the backend exposes); there is
 * intentionally NO delete affordance.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Power, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@shared/auth/Can";
import { StatusBadge } from "@shared/components/StatusBadge";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import type { SubscriptionPlan } from "../types";
import { billingCycleLabelKey } from "./planBillingCycle";

interface PlanCardProps {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleActive: (plan: SubscriptionPlan, isActive: boolean) => void;
  isToggling?: boolean;
}

export function PlanCard({ plan, onEdit, onToggleActive, isToggling = false }: PlanCardProps) {
  const { t, i18n } = useTranslation();
  const cycleKey = billingCycleLabelKey(plan.billingCycle);

  return (
    <div className="flex h-full flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)] transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)] motion-reduce:hover:translate-y-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="text-base font-semibold break-words text-[var(--color-ink-body)]">
            {plan.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {cycleKey && <Badge tone="brand">{t(cycleKey)}</Badge>}
            <StatusBadge kind="subscription" status={plan.isActive ? "active" : "inactive"} />
          </div>
        </div>
        <div className="shrink-0 text-end">
          <span className="text-lg font-bold whitespace-nowrap text-[var(--color-ink-body)] tabular-nums">
            {formatCurrency(plan.price, i18n.language)}
          </span>
        </div>
      </div>

      {plan.description && (
        <p className="line-clamp-3 text-sm text-[var(--color-muted)]">{plan.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-divider)] pt-4">
        <span className="text-xs tabular-nums text-[var(--color-muted)]">
          {formatOrderDate(plan.createdAt, i18n.language)}
        </span>

        <div className="flex items-center gap-1">
          <Can permission="plans.edit">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(plan)}
              aria-label={t("superAdmin.plans.edit")}
              title={t("superAdmin.plans.edit")}
            >
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="plans.edit">
            <Button
              type="button"
              variant={plan.isActive ? "ghost" : "secondary"}
              size="icon-sm"
              disabled={isToggling}
              onClick={() => onToggleActive(plan, !plan.isActive)}
              aria-label={
                plan.isActive
                  ? t("superAdmin.plans.toggle.deactivate")
                  : t("superAdmin.plans.toggle.activate")
              }
              title={
                plan.isActive
                  ? t("superAdmin.plans.toggle.deactivate")
                  : t("superAdmin.plans.toggle.activate")
              }
            >
              {isToggling ? (
                <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Power className="size-4" />
              )}
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
}

/** Loading placeholder matching {@link PlanCard}'s layout. */
export function PlanCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-5 w-40 rounded-full" />
        </div>
        <Skeleton className="h-5 w-20 rounded" />
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <div className="mt-auto flex items-center justify-between border-t border-[var(--color-divider)] pt-4">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </div>
  );
}
