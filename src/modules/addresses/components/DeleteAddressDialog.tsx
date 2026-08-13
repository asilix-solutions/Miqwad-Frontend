/**
 * @file DeleteAddressDialog.tsx
 * @description Delete-confirmation dialog for an address. Mirrors
 * src/modules/admin/components/reference/DeleteCityDialog.tsx.
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
import { useDeleteAddress } from "../hooks/useAddressesQueries";
import type { Address } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  address: Address | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAddressDialog({ address, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteAddress();

  const handleConfirm = async () => {
    if (!address) return;
    try {
      await deleteMutation.mutateAsync(address.id);
      toast.success(t("addresses.success.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-danger-500">{t("addresses.deleteConfirm.title")}</DialogTitle>
          <DialogDescription className="pt-2">
            {t("addresses.deleteConfirm.description", { name: address?.title ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>
            {t("addresses.deleteConfirm.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? t("common.loading") : t("addresses.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
