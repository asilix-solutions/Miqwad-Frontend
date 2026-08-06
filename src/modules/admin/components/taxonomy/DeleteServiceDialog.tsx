/**
 * @file DeleteServiceDialog.tsx
 * @description Confirm-delete dialog for a Service tree node. Deletion is a
 * plain DELETE — the real `/api/Services` contract has no documented
 * "children exist" conflict response yet, so this stays a simple confirm;
 * revisit if the backend starts returning 409 for services with children.
 */

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { useDeleteServiceMutation } from "@modules/services/hooks/useServicesAdminQueries";
import type { Service } from "@modules/services/service.types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  service: Service | null;
}

export function DeleteServiceDialog({ open, onOpenChange, service }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteServiceMutation();

  const handleDelete = async () => {
    if (!service) return;
    try {
      await deleteMutation.mutateAsync(service.id);
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !deleteMutation.isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[420px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-danger-500)]">
            {t("superAdmin.taxonomy.servicesTab.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.taxonomy.servicesTab.deleteConfirm.description", { name: service?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-4 gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending
              ? t("common.loading")
              : t("superAdmin.taxonomy.servicesTab.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
