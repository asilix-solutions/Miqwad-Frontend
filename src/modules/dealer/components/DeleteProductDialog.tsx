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
import { useDeleteProductMutation } from "../hooks/useDealerMutations";
import type { Product } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProductDialog({ product, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteProductMutation();

  const handleConfirm = async () => {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success(t("common.deleted", { defaultValue: "Deleted successfully" }));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle className="text-danger-500">
            {t("dealer.products.deleteConfirmTitle", { defaultValue: "Delete Product" })}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("dealer.products.deleteConfirmBody", {
              name: i18n.language === "ar" ? product?.nameAr : product?.nameEn,
              defaultValue: "Are you sure you want to delete this product?"
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
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
