/**
 * @file DeletePlacementDialog.tsx
 * @description Dialog to confirm deletion of an ad placement.
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
import { useDeletePlacementMutation } from "../../hooks/useAdminQueries";
import type { AdPlacement } from "@modules/ads/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  placement: AdPlacement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePlacementDialog({ placement, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeletePlacementMutation();

  const handleConfirm = async () => {
    if (!placement) return;
    try {
      await deleteMutation.mutateAsync(placement.id);
      toast.success(t("superAdmin.ads.placements.deletedToast"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  const placementName = placement ? (i18n.language === "ar" ? placement.nameAr : placement.nameEn) : "";

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">
            {t("superAdmin.ads.placements.deleteTitle")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.ads.placements.deleteMessage", {
              name: placementName,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
