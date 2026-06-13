import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import {
  useAdminPlansQuery,
  useUpdatePlanMutation,
} from "../hooks/useAdminQueries";
import { DataTable } from "../components/shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@shared/lib/formatCurrency";
import type { SubscriptionPlan } from "@modules/subscriptions/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@shared/lib/utils";
import { DeletePlanDialog } from "../components/subscriptions/DeletePlanDialog";
import { PlanFormDialog } from "../components/subscriptions/PlanFormDialog";
import { useToast } from "@shared/components/ui/toastContext";

export function AdminPlansPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  
  const { data: plans, isLoading, error } = useAdminPlansQuery();
  const updateMutation = useUpdatePlanMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteDialogPlan, setDeleteDialogPlan] = useState<SubscriptionPlan | null>(null);

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      await updateMutation.mutateAsync({
        id: plan.id,
        payload: { isActive: !plan.isActive },
      });
      toast.success(t("superAdmin.plans.success.updated"));
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setFormOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormOpen(true);
  };

  const columns = [
    {
      key: "nameAr",
      header: t("superAdmin.plans.columns.nameAr"),
      render: (row: SubscriptionPlan) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameAr}
        </span>
      ),
    },
    {
      key: "nameEn",
      header: t("superAdmin.plans.columns.nameEn"),
      render: (row: SubscriptionPlan) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameEn}
        </span>
      ),
    },
    {
      key: "price",
      header: t("superAdmin.plans.columns.price"),
      render: (row: SubscriptionPlan) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.price, i18n.language)}
        </span>
      ),
    },
    {
      key: "billingCycle",
      header: t("superAdmin.plans.columns.billingCycle"),
      render: (row: SubscriptionPlan) => (
        <span className="text-sm">
          {row.billingCycle === "monthly" 
            ? t("superAdmin.plans.billingCycles.monthly")
            : t("superAdmin.plans.billingCycles.yearly")
          }
        </span>
      ),
    },
    {
      key: "featuresCount",
      header: t("superAdmin.plans.columns.featuresCount"),
      render: (row: SubscriptionPlan) => (
        <span className="tabular-nums">
          {t("superAdmin.plans.featuresCountLabel", { count: row.features.length })}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.plans.columns.status"),
      render: (row: SubscriptionPlan) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>
          {row.isActive 
            ? t("superAdmin.plans.status.active") 
            : t("superAdmin.plans.status.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: SubscriptionPlan) => (
        <div className="flex items-center gap-1">
          <Can permission="plans.edit">
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-8 h-8", row.isActive ? "text-[var(--color-brand-orange)]" : "text-[var(--color-ink-lighter)]")}
              onClick={() => handleToggleActive(row)}
              disabled={updateMutation.isPending}
            >
              <Power size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-[var(--color-ink-lighter)] hover:text-[var(--color-ink-body)]"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={16} />
            </Button>
          </Can>
          <Can permission="plans.delete">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-danger-500 hover:text-danger-600 hover:bg-danger-50"
              onClick={() => setDeleteDialogPlan(row)}
            >
              <Trash2 size={16} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--color-ink-title)]">
            {t("superAdmin.plans.title")}
          </h1>
          <p className="text-[14px] text-[var(--color-ink-lighter)] mt-1">
            {t("superAdmin.plans.subtitle")}
          </p>
        </div>
        <Can permission="plans.create">
          <Button
            onClick={handleAdd}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white gap-2"
          >
            <Plus size={18} />
            {t("superAdmin.plans.add")}
          </Button>
        </Can>
      </div>

      <DataTable<SubscriptionPlan>
        rows={plans ?? []}
        columns={columns}
        isLoading={isLoading}
        isError={!!error}
        getRowKey={(row) => String(row.id)}
        emptyText={t("common.empty.noData")}
      />

      {formOpen && (
        <PlanFormDialog
          plan={editingPlan}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteDialogPlan && (
        <DeletePlanDialog
          plan={deleteDialogPlan}
          open={!!deleteDialogPlan}
          onOpenChange={(open: boolean) => !open && setDeleteDialogPlan(null)}
        />
      )}
    </div>
  );
}
