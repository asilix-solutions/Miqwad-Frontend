/**
 * @file DeleteModelDialog.tsx
 * @description Delete confirmation for a model
 * (`/api/Brands/{brandId}/models/{modelId}`, 204 on success). A 409
 * response surfaces as a blocked-delete toast.
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
import { useDeleteModelMutation } from "../../hooks/useAdminQueries";
import type { VehicleModel } from "@modules/vehicles/types";
import { AppError } from "@shared/types/api";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  brandId: number | null;
  model: VehicleModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteModelDialog({ brandId, model, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteModelMutation();

  const handleConfirm = async () => {
    if (!model || !brandId) return;
    try {
      await deleteMutation.mutateAsync({ brandId, modelId: model.id });
      toast.success(t("superAdmin.models.success.deleted"));
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AppError && err.status === 409) {
        toast.error(t("superAdmin.models.deleteConfirm.blocked"));
      } else {
        toast.error(t("common.deleteFailed"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">
            {t("superAdmin.models.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.models.deleteConfirm.description", {
              name: model?.name ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("superAdmin.models.deleteConfirm.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("superAdmin.models.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
