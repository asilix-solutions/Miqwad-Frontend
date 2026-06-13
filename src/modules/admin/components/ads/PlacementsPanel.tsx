/**
 * @file PlacementsPanel.tsx
 * @description Panel displaying a list of ad placements.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { usePlacementsQuery, useUpdatePlacementMutation } from "../../hooks/useAdminQueries";
import { DataTable } from "../shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@shared/lib/utils";
import type { AdPlacement } from "@modules/ads/types";
import { PlacementFormDialog } from "./PlacementFormDialog";
import { DeletePlacementDialog } from "./DeletePlacementDialog";
import { useToast } from "@shared/components/ui/toastContext";

export function PlacementsPanel() {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const { data: placements, isLoading, error } = usePlacementsQuery();
  const updateMutation = useUpdatePlacementMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null);
  const [deleteDialogPlacement, setDeleteDialogPlacement] = useState<AdPlacement | null>(null);

  const handleToggleActive = async (placement: AdPlacement) => {
    try {
      await updateMutation.mutateAsync({
        id: placement.id,
        payload: { isActive: !placement.isActive },
      });
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  const handleAdd = () => {
    setEditingPlacement(null);
    setFormOpen(true);
  };

  const handleEdit = (placement: AdPlacement) => {
    setEditingPlacement(placement);
    setFormOpen(true);
  };

  const columns = [
    {
      key: "name",
      header: t("superAdmin.ads.placements.form.nameAr"),
      render: (row: AdPlacement) => {
        const name = i18n.language === "ar" ? row.nameAr : row.nameEn;
        return (
          <span className={cn("font-medium", !row.isActive && "text-[var(--color-muted)]")}>
            {name}
          </span>
        );
      },
    },
    {
      key: "code",
      header: t("superAdmin.ads.columns.code"),
      render: (row: AdPlacement) => (
        <span className="text-xs text-[var(--color-muted)] font-mono" dir="ltr">
          {row.code}
        </span>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.ads.columns.status"),
      render: (row: AdPlacement) => (
        <Can permission="ads.publish">
          <Switch
            checked={row.isActive}
            onCheckedChange={() => handleToggleActive(row)}
            disabled={updateMutation.isPending}
          />
        </Can>
      ),
    },
    {
      key: "actions",
      header: t("superAdmin.ads.columns.actions"),
      className: "text-end",
      render: (row: AdPlacement) => (
        <div className="flex justify-end gap-2">
          <Can permission="ads.edit">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => handleEdit(row)}
            >
              <Pencil size={16} />
            </Button>
          </Can>
          <Can permission="ads.delete">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-danger-500 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => setDeleteDialogPlacement(row)}
            >
              <Trash2 size={16} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Can permission="ads.create">
          <Button onClick={handleAdd} className="gap-2 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white">
            <Plus size={18} />
            {t("superAdmin.ads.placements.add")}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<AdPlacement>
          rows={placements ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("superAdmin.ads.placements.empty")}
        />
      </div>

      {formOpen && (
        <PlacementFormDialog
          placement={editingPlacement}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {deleteDialogPlacement && (
        <DeletePlacementDialog
          placement={deleteDialogPlacement}
          open={!!deleteDialogPlacement}
          onOpenChange={(open: boolean) => !open && setDeleteDialogPlacement(null)}
        />
      )}
    </div>
  );
}
