import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban } from "lucide-react";
import { useSubscriptionsQuery } from "../../hooks/useAdminQueries";
import { DataTable } from "../shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatDate } from "@shared/lib/formatDate";
import type { ProviderSubscription } from "@modules/subscriptions/types";
import { StatusBadge } from "../shared/StatusBadge";
import { cn } from "@shared/lib/utils";
import { CancelSubscriptionDialog } from "./CancelSubscriptionDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabStatus = "active" | "all" | "expired" | "cancelled" | "pending";

export function SubscriptionsListPanel() {
  const { t, i18n } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<TabStatus>("active");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cancelDialogSub, setCancelDialogSub] = useState<ProviderSubscription | null>(null);

  const { data: response, isLoading, error } = useSubscriptionsQuery({
    page: 1,
    pageSize: 100,
    status: activeTab,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const columns = [
    {
      key: "providerName",
      header: t("superAdmin.subscriptions.columns.providerName"),
      render: (row: ProviderSubscription) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[var(--color-surface-2)] text-[var(--color-ink-lighter)] text-xs">
              {row.providerName.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.providerName}</span>
        </div>
      ),
    },
    {
      key: "providerType",
      header: t("superAdmin.subscriptions.columns.providerType"),
      render: (row: ProviderSubscription) => (
        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-ink-body)] border border-[var(--color-divider)]">
          {t(`superAdmin.subscriptions.types.${row.providerType}`)}
        </span>
      ),
    },
    {
      key: "planName",
      header: t("superAdmin.subscriptions.columns.planName"),
      render: (row: ProviderSubscription) => row.planName,
    },
    {
      key: "price",
      header: t("superAdmin.subscriptions.columns.price"),
      render: (row: ProviderSubscription) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.price, i18n.language)}
        </span>
      ),
    },
    {
      key: "billingCycle",
      header: t("superAdmin.subscriptions.columns.billingCycle"),
      render: (row: ProviderSubscription) => (
        <span className="text-sm">
          {row.billingCycle === "monthly" 
            ? t("superAdmin.plans.billingCycles.monthly")
            : t("superAdmin.plans.billingCycles.yearly")
          }
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.subscriptions.columns.status"),
      render: (row: ProviderSubscription) => (
        <StatusBadge status={row.status} kind="subscription" />
      ),
    },
    {
      key: "startDate",
      header: t("superAdmin.subscriptions.columns.startDate"),
      render: (row: ProviderSubscription) => (
        <span className="tabular-nums text-sm text-[var(--color-ink-lighter)]">
          {formatDate(row.startDate, i18n.language)}
        </span>
      ),
    },
    {
      key: "endDate",
      header: t("superAdmin.subscriptions.columns.endDate"),
      render: (row: ProviderSubscription) => (
        <span className="tabular-nums text-sm text-[var(--color-ink-lighter)]">
          {formatDate(row.endDate, i18n.language)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      className: "text-end",
      render: (row: ProviderSubscription) => {
        if (row.status !== "active") return null;
        return (
          <div className="flex justify-end gap-2">
            <Can permission="subscriptions.manage">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-danger-500 hover:bg-danger-50 hover:text-danger-600 rounded-[var(--radius-md)]"
                onClick={() => setCancelDialogSub(row)}
                title={t("common.cancel")}
              >
                <Ban size={16} />
              </Button>
            </Can>
          </div>
        );
      },
    },
  ];

  const TABS: { id: TabStatus; label: string }[] = [
    { id: "all", label: t("superAdmin.subscriptions.tabs.all") },
    { id: "active", label: t("superAdmin.subscriptions.status.active") },
    { id: "pending", label: t("superAdmin.subscriptions.status.pending") },
    { id: "expired", label: t("superAdmin.subscriptions.status.expired") },
    { id: "cancelled", label: t("superAdmin.subscriptions.status.cancelled") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex bg-[var(--color-surface-2)] p-1 rounded-full w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                activeTab === tab.id
                  ? "bg-white text-[var(--color-brand-blue)] shadow-sm"
                  : "text-[var(--color-ink-lighter)] hover:text-[var(--color-ink-body)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("superAdmin.subscriptions.types.all")}</SelectItem>
            <SelectItem value="workshop">{t("superAdmin.subscriptions.types.workshop")}</SelectItem>
            <SelectItem value="scrap">{t("superAdmin.subscriptions.types.scrap")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<ProviderSubscription>
          rows={response?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("common.empty.noData")}
        />
      </div>

      {cancelDialogSub && (
        <CancelSubscriptionDialog
          subscription={cancelDialogSub}
          open={!!cancelDialogSub}
          onOpenChange={(open: boolean) => !open && setCancelDialogSub(null)}
        />
      )}
    </div>
  );
}
