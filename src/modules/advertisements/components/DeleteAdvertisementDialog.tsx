/**
 * @file DeleteAdvertisementDialog.tsx
 * @description Danger-confirm dialog for deleting an advertisement
 * (DELETE /api/Advertisement/{id}). Invalidates the list on success.
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
import { useDeleteAdvertisementMutation } from "../hooks/useAdvertisementsQueries";
import type { Advertisement } from "../types";

interface DeleteAdvertisementDialogProps {
  advertisement: Advertisement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAdvertisementDialog({
  advertisement,
  open,
  onOpenChange,
}: DeleteAdvertisementDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteAdvertisementMutation();

  const handleConfirm = async () => {
    if (!advertisement) return;
    try {
      await deleteMutation.mutateAsync(advertisement.id);
      toast.success(t("superAdmin.ads.toasts.deleted"));
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
            {t("superAdmin.ads.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.ads.deleteConfirm.message", { title: advertisement?.title ?? "" })}
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
            {deleteMutation.isPending ? t("common.loading") : t("common.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
