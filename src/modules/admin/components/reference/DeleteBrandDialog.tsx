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
import { useDeleteBrandMutation, useModelsForBrandQuery } from "../../hooks/useAdminQueries";
import type { Brand } from "@modules/vehicles/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  brand: Brand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBrandDialog({ brand, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteBrandMutation();
  const modelsQuery = useModelsForBrandQuery(brand?.id ?? null);
  
  const modelsCount = modelsQuery.data?.length ?? 0;

  const handleConfirm = async () => {
    if (!brand) return;
    try {
      await deleteMutation.mutateAsync(brand.id);
      toast.success(t("superAdmin.brands.success.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">
            {t("superAdmin.brands.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.brands.deleteConfirm.description", {
              name: brand?.nameAr ?? "",
              count: modelsCount,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("superAdmin.brands.deleteConfirm.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("superAdmin.brands.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
