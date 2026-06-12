import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useAdminPackagesQuery,
  useUpdatePackageMutation,
} from "../hooks/useAdminQueries";
import { DataTable } from "../components/shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@shared/lib/formatCurrency";
import type { ServicePackage } from "@modules/services/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@shared/lib/utils";
import { DeletePackageDialog } from "../components/packages/DeletePackageDialog";
import { useToast } from "@shared/components/ui/toastContext";

export function AdminPackagesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { data: packages, isLoading, error } = useAdminPackagesQuery();
  const updateMutation = useUpdatePackageMutation();

  const [deleteDialogPkg, setDeleteDialogPkg] = useState<ServicePackage | null>(null);

  const handleToggleActive = async (pkg: ServicePackage) => {
    try {
      await updateMutation.mutateAsync({
        id: pkg.id,
        payload: { isActive: !pkg.isActive },
      });
      toast.success(t("superAdmin.packages.success.updated"));
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const columns = [
    {
      key: "nameAr",
      header: t("superAdmin.packages.columns.nameAr"),
      render: (row: ServicePackage) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameAr}
        </span>
      ),
    },
    {
      key: "nameEn",
      header: t("superAdmin.packages.columns.nameEn"),
      render: (row: ServicePackage) => (
        <span className={cn(!row.isActive && "text-[var(--color-ink-lighter)]")}>
          {row.nameEn}
        </span>
      ),
    },
    {
      key: "servicesCount",
      header: t("superAdmin.packages.columns.servicesCount"),
      render: (row: ServicePackage) => (
        <span className="tabular-nums">
          {t("superAdmin.packages.servicesCountLabel", { count: row.serviceIds.length })}
        </span>
      ),
    },
    {
      key: "price",
      header: t("superAdmin.packages.columns.price"),
      render: (row: ServicePackage) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(row.price, i18n.language)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.packages.columns.status"),
      render: (row: ServicePackage) => (
        <Badge tone={row.isActive ? "success" : "neutral"}>
          {row.isActive 
            ? t("superAdmin.packages.status.active") 
            : t("superAdmin.packages.status.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (row: ServicePackage) => (
        <div className="flex items-center gap-1">
          <Can permission="packages.edit">
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
              onClick={() => navigate(`/admin/packages/builder?id=${row.id}`)}
            >
              <Pencil size={16} />
            </Button>
          </Can>
          <Can permission="packages.delete">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-danger-500 hover:text-danger-600 hover:bg-danger-50"
              onClick={() => setDeleteDialogPkg(row)}
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
            {t("superAdmin.packages.title")}
          </h1>
          <p className="text-[14px] text-[var(--color-ink-lighter)] mt-1">
            {t("superAdmin.packages.subtitle")}
          </p>
        </div>
        <Can permission="packages.create">
          <Button
            onClick={() => navigate("/admin/packages/builder")}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90 text-white gap-2"
          >
            <Plus size={18} />
            {t("superAdmin.packages.add")}
          </Button>
        </Can>
      </div>

      <DataTable<ServicePackage>
        rows={packages ?? []}
        columns={columns}
        isLoading={isLoading}
        isError={!!error}
        getRowKey={(row) => String(row.id)}
        emptyText={t("common.empty.noData")}
      />

      {deleteDialogPkg && (
        <DeletePackageDialog
          pkg={deleteDialogPkg}
          open={!!deleteDialogPkg}
          onOpenChange={(open: boolean) => !open && setDeleteDialogPkg(null)}
        />
      )}
    </div>
  );
}
