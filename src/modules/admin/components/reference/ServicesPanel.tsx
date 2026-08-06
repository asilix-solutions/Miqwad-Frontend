/**
 * @file ServicesPanel.tsx
 *
 * Admin panel for listing, filtering, and managing Services.
 * Category column shows the full L1 › L2 › L3 path via getCategoryPath.
 * Category filter operates at L1 level with client-side subtree matching,
 * so no API changes are needed to support branch filtering.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "../shared/DataTable";
import { useAdminServicesQuery, useUpdateServiceMutation } from "../../hooks/useAdminQueries";
import { useServiceCategoriesQuery } from "@modules/services/hooks/useServicesQueries";
import { getCategoryPath } from "@modules/services/lib/categoryTree";
import type { PricedService, ServiceCategory } from "@modules/services/types";
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collect the ids of all descendants of `ancestorId` (inclusive). */
function collectDescendantIds(
  categories: ServiceCategory[],
  ancestorId: number,
): Set<number> {
  const result = new Set<number>();
  const queue = [ancestorId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    result.add(current);
    for (const cat of categories) {
      if (cat.parentId === current) queue.push(cat.id);
    }
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ServicesPanel() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language;

  const [l1Filter, setL1Filter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch services with server-side isActive filter only; category branch filtered client-side.
  const q = useAdminServicesQuery({
    isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
  });

  const categoriesQ = useServiceCategoriesQuery();
  const updateMutation = useUpdateServiceMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedService, setSelectedService] = useState<PricedService | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<PricedService | null>(null);

  // L1 options for the category filter
  const l1Options = useMemo(
    () => (categoriesQ.data ?? []).filter((c) => c.level === 1),
    [categoriesQ.data],
  );

  // Client-side category branch filtering
  const services = useMemo(() => {
    const all = q.data ?? [];
    if (l1Filter === "all" || !categoriesQ.data) return all;
    const subtreeIds = collectDescendantIds(categoriesQ.data, Number(l1Filter));
    return all.filter((s) => subtreeIds.has(s.categoryId));
  }, [q.data, categoriesQ.data, l1Filter]);

  const openCreate = () => {
    setFormMode("create");
    setSelectedService(undefined);
    setFormOpen(true);
  };

  const openEdit = (svc: PricedService) => {
    setFormMode("edit");
    setSelectedService(svc);
    setFormOpen(true);
  };

  const openDelete = (svc: PricedService) => {
    setServiceToDelete(svc);
    setDeleteOpen(true);
  };

  const handleToggleActive = async (svc: PricedService) => {
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
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {/* L1 category branch filter */}
          <Select value={l1Filter} onValueChange={setL1Filter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("superAdmin.services.filters.category")} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">{t("superAdmin.services.filters.all")}</SelectItem>
              {l1Options.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {lang === "ar" ? cat.nameAr : cat.nameEn}
                </SelectItem>
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
        <DataTable<PricedService>
          rows={services}
          isLoading={q.isLoading}
          isError={q.isError}
          getRowKey={(svc) => svc.id.toString()}
          columns={[
            {
              key: "nameAr",
              header: t("superAdmin.services.columns.nameAr"),
              render: (svc: PricedService) => (
                <span className={!svc.isActive ? "opacity-50" : ""}>{svc.nameAr}</span>
              ),
            },
            {
              key: "nameEn",
              header: t("superAdmin.services.columns.nameEn"),
              render: (svc: PricedService) => (
                <span dir="ltr" className={!svc.isActive ? "opacity-50" : ""}>{svc.nameEn}</span>
              ),
            },
            {
              key: "categoryId",
              header: t("superAdmin.services.columns.categoryId"),
              render: (svc: PricedService) => {
                const cats = categoriesQ.data ?? [];
                const { l1, l2, l3 } = getCategoryPath(cats, svc.categoryId);
                const nameOf = (c: typeof l1) =>
                  c ? (lang === "ar" ? c.nameAr : c.nameEn) : null;
                const parts = [nameOf(l1), nameOf(l2), nameOf(l3)].filter(Boolean);
                const pathStr = parts.join(" › ");
                if (!pathStr) {
                  return <span className="text-[var(--color-muted)]">—</span>;
                }
                return (
                  <span
                    title={pathStr}
                    className={`block max-w-[240px] truncate text-sm ${!svc.isActive ? "opacity-50" : ""}`}
                  >
                    {parts.map((part, i) => (
                      <span key={i}>
                        {i > 0 && (
                          <span className="mx-1 text-[var(--color-muted)] select-none" aria-hidden>
                            ›
                          </span>
                        )}
                        <span className={i === parts.length - 1 ? "font-medium" : "text-[var(--color-muted)]"}>
                          {part}
                        </span>
                      </span>
                    ))}
                  </span>
                );
              },
            },
            {
              key: "basePrice",
              header: t("superAdmin.services.columns.basePrice"),
              render: (svc: PricedService) => (
                <span className={`tabular-nums ${!svc.isActive ? "opacity-50" : ""}`}>
                  {formatCurrency(svc.basePrice, i18n.language)}
                </span>
              ),
            },
            {
              key: "isActive",
              header: t("superAdmin.services.columns.isActive"),
              render: (svc: PricedService) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${svc.isActive ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-600"}`}>
                  {svc.isActive ? t("superAdmin.services.status.active") : t("superAdmin.services.status.inactive")}
                </span>
              ),
            },
            {
              key: "actions",
              header: t("superAdmin.services.columns.actions"),
              className: "text-end",
              render: (svc: PricedService) => (
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
