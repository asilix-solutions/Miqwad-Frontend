import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setAdminStatus } from "@modules/providers/store/providersSlice";
import { useToast } from "@shared/components/ui/toastContext";
import { AdminProviderCard } from "../components/AdminProviderCard";
import { RejectProviderDialog } from "../components/RejectProviderDialog";
import {
  useAdminProvidersQuery,
  useApproveProviderMutation,
  useRejectProviderMutation,
} from "../hooks/useAdminQueries";
import type { AdminProvider, AdminProviderStatus } from "../types";
import { cn } from "@shared/lib/utils";

/**
 * /admin/providers — list of provider applications with status tabs.
 *
 * Responsive layout:
 *  - mobile: tabs scroll horizontally, cards stack single-column.
 *  - sm+: tabs sit inline with a 2-column card grid.
 */
const TABS: ReadonlyArray<{ key: AdminProviderStatus; label: string }> = [
  { key: "pending", label: "admin.statusPending" },
  { key: "approved", label: "admin.statusApproved" },
  { key: "rejected", label: "admin.statusRejected" },
  { key: "all", label: "admin.statusAll" },
];

export function AdminProvidersPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const status = useAppSelector((s) => s.providers.adminStatus);
  const q = useAdminProvidersQuery(status);
  const approveMutation = useApproveProviderMutation();
  const rejectMutation = useRejectProviderMutation();
  const [rejectTarget, setRejectTarget] = useState<AdminProvider | null>(null);

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success(t("admin.approved"));
    } catch {
      toast.error(t("admin.actionFailed"));
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ providerId: rejectTarget.id, reason });
      toast.success(t("admin.rejected"));
      setRejectTarget(null);
    } catch {
      toast.error(t("admin.actionFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
          {t("admin.providersTitle")}
        </h1>
        <p className="text-sm text-ink-500 mt-1">{t("admin.providersSubtitle")}</p>
      </header>

      {/* Tabs — horizontally scrollable on mobile, inline on sm+ */}
      <div
        role="tablist"
        className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1"
      >
        {TABS.map((tab) => {
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => dispatch(setAdminStatus(tab.key))}
              className={cn(
                "shrink-0 h-9 rounded-full px-4 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-brand-500 text-white shadow-brand"
                  : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-100",
              )}
            >
              {t(tab.label)}
            </button>
          );
        })}
      </div>

      {q.isLoading ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (q.data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title={t("admin.emptyForStatus")}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {q.data?.map((p) => (
            <AdminProviderCard
              key={p.id}
              provider={p}
              onApprove={handleApprove}
              onReject={(prov) => setRejectTarget(prov)}
              isMutating={approveMutation.isPending || rejectMutation.isPending}
            />
          ))}
        </div>
      )}

      <RejectProviderDialog
        open={rejectTarget != null}
        provider={rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onConfirm={handleReject}
        submitting={rejectMutation.isPending}
      />
    </div>
  );
}


