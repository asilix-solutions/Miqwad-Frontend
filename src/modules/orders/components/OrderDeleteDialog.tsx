/**
 * @file OrderDeleteDialog.tsx
 * @description Delete-confirmation dialog for an order. Mirrors
 * src/modules/addresses/components/DeleteAddressDialog.tsx.
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
import { useDeleteOrder } from "../hooks/useOrdersQueries";
import type { Order } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDeleteDialog({ order, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteOrder();

  const handleConfirm = async () => {
    if (!order) return;
    try {
      await deleteMutation.mutateAsync(order.id);
      toast.success(t("orders.success.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">{t("orders.deleteConfirm.title")}</DialogTitle>
          <DialogDescription className="pt-2">
            {t("orders.deleteConfirm.description", { name: order?.trackNumber || order?.id || "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            {t("orders.deleteConfirm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? t("common.loading") : t("orders.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
