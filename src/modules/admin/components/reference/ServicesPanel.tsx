import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "../shared/DataTable";
import { useAdminServicesQuery, useUpdateServiceMutation } from "../../hooks/useAdminQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import type { Service } from "@modules/services/types";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { DeleteServiceDialog } from "./DeleteServiceDialog";
import { Can } from "@shared/auth/Can";
import { formatCurrency } from "@shared/lib/formatCurrency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@shared/components/ui/toastContext";

export function ServicesPanel() {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const [categoryIdFilter, setCategoryIdFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const q = useAdminServicesQuery({
    categoryId: categoryIdFilter !== "all" ? Number(categoryIdFilter) : undefined,
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
  });

  const categoriesQ = useServiceCategoriesQuery();
  const updateMutation = useUpdateServiceMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<Service | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setSelectedService(undefined);
    setFormOpen(true);
  };

  const openEdit = (svc: Service) => {
    setFormMode("edit");
    setSelectedService(svc);
    setFormOpen(true);
  };

  const openDelete = (svc: Service) => {
    setServiceToDelete(svc);
    setDeleteOpen(true);
  };

  const handleToggleActive = async (svc: Service) => {
    try {
      await updateMutation.mutateAsync({
        id: svc.id,
        payload: { isActive: !svc.isActive },
      });
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Add button toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={categoryIdFilter} onValueChange={setCategoryIdFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("superAdmin.services.filters.category")} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">{t("superAdmin.services.filters.all")}</SelectItem>
              {categoriesQ.data?.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nameAr}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("superAdmin.services.filters.status")} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">{t("superAdmin.services.filters.all")}</SelectItem>
              <SelectItem value="active">{t("superAdmin.services.status.active")}</SelectItem>
              <SelectItem value="inactive">{t("superAdmin.services.status.inactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Can permission="services.create">
          <Button
            onClick={openCreate}
            className="bg-[var(--color-brand-orange)] hover:bg-[var(--color-brand-orange)]/90"
          >
            <Plus className="me-2 h-4 w-4" />
            {t("superAdmin.services.add")}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<Service>
          rows={q.data ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          getRowKey={(svc) => svc.id.toString()}
          columns={[
            {
              key: "nameAr",
              header: t("superAdmin.services.columns.nameAr"),
              render: (svc: Service) => (
                <span className={!svc.isActive ? "opacity-50" : ""}>{svc.nameAr}</span>
              ),
            },
            {
              key: "nameEn",
              header: t("superAdmin.services.columns.nameEn"),
              render: (svc: Service) => (
                <span dir="ltr" className={!svc.isActive ? "opacity-50" : ""}>{svc.nameEn}</span>
              ),
            },
            {
              key: "categoryId",
              header: t("superAdmin.services.columns.categoryId"),
              render: (svc: Service) => {
                const cat = categoriesQ.data?.find(c => c.id === svc.categoryId);
                return <span className={!svc.isActive ? "opacity-50" : ""}>{cat?.nameAr ?? "—"}</span>;
              },
            },
            {
              key: "basePrice",
              header: t("superAdmin.services.columns.basePrice"),
              render: (svc: Service) => (
                <span className={`tabular-nums ${!svc.isActive ? "opacity-50" : ""}`}>{formatCurrency(svc.basePrice, i18n.language)}</span>
              ),
            },
            {
              key: "isActive",
              header: t("superAdmin.services.columns.isActive"),
              render: (svc: Service) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${svc.isActive ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-600"}`}>
                  {svc.isActive ? t("superAdmin.services.status.active") : t("superAdmin.services.status.inactive")}
                </span>
              ),
            },
            {
              key: "actions",
              header: t("superAdmin.services.columns.actions"),
              className: "text-end",
              render: (svc: Service) => (
                <div
                  className="flex justify-end items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Can permission="services.edit">
                    <div className="flex items-center gap-2 me-2">
                      <Switch 
                        checked={svc.isActive}
                        onCheckedChange={() => handleToggleActive(svc)}
                        disabled={updateMutation.isPending}
                        dir="ltr"
                      />
                    </div>
                  </Can>
                  <Can permission="services.edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openEdit(svc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Can>
                  <Can permission="services.delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--color-danger-500)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
                      onClick={() => openDelete(svc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Can>
                </div>
              ),
            },
          ]}
        />
      </div>

      {formOpen && (
        <ServiceFormDialog
          mode={formMode}
          service={selectedService}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteOpen && (
        <DeleteServiceDialog
          service={serviceToDelete}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}
