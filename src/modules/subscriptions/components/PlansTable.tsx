/**
 * @file PlansTable.tsx
 * @description Table view for the admin Plans section — the shared
 * {@link DataTable} with columns: name, price, billing cycle, status, created
 * date, and an actions cell (edit + activate/deactivate toggle). Reads the
 * same `useSubscriptionPlans` data as {@link PlansCardGrid}. Activate /
 * deactivate is the ONLY lifecycle action — there is no delete column.
 */
import { useTranslation } from "react-i18next";
import { Pencil, Power, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@shared/components/DataTable";
import { StatusBadge } from "@shared/components/StatusBadge";
import { Can } from "@shared/auth/Can";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import type { SubscriptionPlan } from "../types";
import { billingCycleLabelKey } from "./planBillingCycle";

interface PlansTableProps {
  items: SubscriptionPlan[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (plan: SubscriptionPlan) => void;
  onToggleActive: (plan: SubscriptionPlan, isActive: boolean) => void;
  togglingId?: number | null;
}

export function PlansTable({
  items,
  isLoading,
  isError,
  onEdit,
  onToggleActive,
  togglingId = null,
}: PlansTableProps) {
  const { t, i18n } = useTranslation();

  const columns: DataTableColumn<SubscriptionPlan>[] = [
    {
      key: "name",
      header: t("superAdmin.plans.columns.name"),
      render: (row) => (
        <span className="font-medium text-[var(--color-ink-body)]">{row.name}</span>
      ),
    },
    {
      key: "price",
      header: t("superAdmin.plans.columns.price"),
      render: (row) => (
        <span className="tabular-nums">{formatCurrency(row.price, i18n.language)}</span>
      ),
    },
    {
      key: "billingCycle",
      header: t("superAdmin.plans.columns.billingCycle"),
      render: (row) => {
        const cycleKey = billingCycleLabelKey(row.billingCycle);
        return (
          <span className="text-[var(--color-muted)]">
            {cycleKey ? t(cycleKey) : String(row.billingCycle)}
          </span>
        );
      },
    },
    {
      key: "isActive",
      header: t("superAdmin.plans.columns.status"),
      render: (row) => (
        <StatusBadge kind="subscription" status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "createdAt",
      header: t("superAdmin.plans.columns.createdAt"),
      render: (row) => (
        <span className="tabular-nums text-[var(--color-muted)]">
          {formatOrderDate(row.createdAt, i18n.language)}
        </span>
      ),
    },
    {
      key: "actions",
      header: t("superAdmin.plans.columns.actions"),
      className: "text-end",
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Can permission="plans.edit">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row)}
              aria-label={t("superAdmin.plans.edit")}
              title={t("superAdmin.plans.edit")}
            >
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="plans.edit">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={togglingId === row.id}
              onClick={() => onToggleActive(row, !row.isActive)}
              aria-label={
                row.isActive
                  ? t("superAdmin.plans.toggle.deactivate")
                  : t("superAdmin.plans.toggle.activate")
              }
              title={
                row.isActive
                  ? t("superAdmin.plans.toggle.deactivate")
                  : t("superAdmin.plans.toggle.activate")
              }
            >
              {togglingId === row.id ? (
                <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Power className="size-4" />
              )}
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <DataTable<SubscriptionPlan>
      columns={columns}
      rows={items}
      isLoading={isLoading}
      isError={isError}
      errorText={t("superAdmin.plans.errorTitle")}
      emptyText={t("superAdmin.plans.empty.title")}
      getRowKey={(row) => String(row.id)}
    />
  );
}
