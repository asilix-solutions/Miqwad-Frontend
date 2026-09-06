/**
 * @file AdminSubscriptionsPage.tsx
 * @description Admin Subscriptions section — Stage 2 builds the live PLANS tab
 * on top of the Stage-1 data layer (`src/modules/subscriptions/`). The tab
 * shell keeps both tabs (Plans / Provider Subscriptions, `?tab=` synced); the
 * Provider Subscriptions tab is a clearly-marked Stage-3 placeholder and is
 * intentionally not built here.
 *
 * Plans tab: a cards ⇄ table view (persisted in localStorage, defaults to
 * cards), explicit loading / error / empty states, an "Add plan" button gated
 * by `plans.create`, a create+edit dialog, and an optimistic
 * activate/deactivate toggle. There is NO delete affordance — the backend has
 * no DELETE endpoint for plans.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutGrid, List, Plus, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { cn } from "@shared/lib/utils";
import { Can } from "@shared/auth/Can";
import { useToast } from "@shared/components/ui/toastContext";
import {
  useSubscriptionPlans,
  useTogglePlanActive,
} from "../hooks/useSubscriptionQueries";
import type { SubscriptionPlan } from "../types";
import { PlansCardGrid } from "../components/PlansCardGrid";
import { PlansTable } from "../components/PlansTable";
import { PlansEmptyState } from "../components/PlansEmptyState";
import { PlanFormDialog } from "../components/PlanFormDialog";

type TabValue = "plans" | "providers";
type ViewMode = "cards" | "table";

const PAGE_SIZE = 12;
const VIEW_MODE_STORAGE_KEY = "maqwad.adminPlans.viewMode";

function readStoredViewMode(): ViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
}

export function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab: TabValue = searchParams.get("tab") === "providers" ? "providers" : "plans";
  const setTab = (tab: TabValue) => setSearchParams(tab === "plans" ? {} : { tab });

  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTarget, setFormTarget] = useState<SubscriptionPlan | null>(null);

  const q = useSubscriptionPlans({ pageNumber, pageSize: PAGE_SIZE });
  const toggleMutation = useTogglePlanActive();

  const items = q.data?.items ?? [];
  const totalPages = q.data?.totalPages ?? 1;
  const isEmpty = !q.isLoading && !q.isError && items.length === 0;
  const togglingId = toggleMutation.isPending ? toggleMutation.variables?.id ?? null : null;

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage unavailable (private mode / disabled) — in-memory state still works.
    }
  };

  const openCreate = () => {
    setFormTarget(null);
    setIsFormOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setFormTarget(plan);
    setIsFormOpen(true);
  };

  const handleToggleActive = (plan: SubscriptionPlan, isActive: boolean) => {
    toggleMutation.mutate(
      { id: plan.id, isActive },
      {
        onSuccess: () => {
          toast.success(
            isActive
              ? t("superAdmin.plans.toasts.activated")
              : t("superAdmin.plans.toasts.deactivated"),
          );
        },
        onError: () => {
          toast.error(t("superAdmin.plans.toasts.toggleFailed"));
        },
      },
    );
  };

  const tabs: { value: TabValue; label: string }[] = [
    { value: "plans", label: t("superAdmin.subscriptions.tabs.plans") },
    { value: "providers", label: t("superAdmin.subscriptions.tabs.providers") },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[var(--color-ink-title)]">
            {t("superAdmin.plans.title")}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t("superAdmin.plans.subtitle")}
          </p>
        </div>

        {currentTab === "plans" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-1">
              <Button
                type="button"
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon-sm"
                title={t("superAdmin.plans.viewMode.cards")}
                aria-label={t("superAdmin.plans.viewMode.cards")}
                aria-pressed={viewMode === "cards"}
                onClick={() => changeViewMode("cards")}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                title={t("superAdmin.plans.viewMode.table")}
                aria-label={t("superAdmin.plans.viewMode.table")}
                aria-pressed={viewMode === "table"}
                onClick={() => changeViewMode("table")}
              >
                <List className="size-4" />
              </Button>
            </div>
            {q.isError && (
              <Button type="button" variant="outline" onClick={() => q.refetch()}>
                <RotateCw className="size-4" />
                {t("common.retry")}
              </Button>
            )}
            <Can permission="plans.create">
              <Button type="button" onClick={openCreate}>
                <Plus className="size-4" />
                {t("superAdmin.plans.add")}
              </Button>
            </Can>
          </div>
        )}
      </div>

      <div className="flex w-fit rounded-full bg-[var(--color-surface-2)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setTab(tab.value)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none",
              currentTab === tab.value
                ? "bg-[var(--color-surface)] text-[var(--color-brand-blue)] shadow-[var(--shadow-1)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink-body)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {currentTab === "providers" ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-divider)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-[var(--shadow-1)]"
          role="status"
        >
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            {t("superAdmin.subscriptions.stage3.badge")}
          </span>
          <h2 className="text-base font-semibold text-[var(--color-ink-body)]">
            {t("superAdmin.subscriptions.stage3.title")}
          </h2>
          <p className="max-w-sm text-sm text-[var(--color-muted)]">
            {t("superAdmin.subscriptions.stage3.description")}
          </p>
        </div>
      ) : isEmpty ? (
        <PlansEmptyState onCreate={openCreate} />
      ) : viewMode === "cards" ? (
        <PlansCardGrid
          items={items}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => q.refetch()}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />
      ) : (
        <PlansTable
          items={items}
          isLoading={q.isLoading}
          isError={q.isError}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          togglingId={togglingId}
        />
      )}

      {currentTab === "plans" && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className={
                  pageNumber === 1
                    ? "pointer-events-none cursor-default gap-1 px-2.5 opacity-50"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.back")}
              >
                {t("common.back")}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-[var(--color-muted)]">
                {pageNumber} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                className={
                  pageNumber === totalPages
                    ? "pointer-events-none cursor-default gap-1 px-2.5 opacity-50"
                    : "cursor-pointer gap-1 px-2.5"
                }
                aria-label={t("common.next")}
              >
                {t("common.next")}
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {isFormOpen && (
        <PlanFormDialog plan={formTarget} open={isFormOpen} onOpenChange={setIsFormOpen} />
      )}
    </div>
  );
}
