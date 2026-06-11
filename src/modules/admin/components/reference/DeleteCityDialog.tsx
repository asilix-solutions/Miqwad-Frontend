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
import { useDeleteCityMutation } from "../../hooks/useAdminQueries";
import type { City } from "../../types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  city: City | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCityDialog({ city, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteCityMutation();

  const handleConfirm = async () => {
    if (!city) return;
    try {
      await deleteMutation.mutateAsync(city.id);
      toast.success(t("superAdmin.cities.success.deleted"));
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
            {t("superAdmin.cities.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.cities.deleteConfirm.description", {
              name: city?.nameAr ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("superAdmin.cities.deleteConfirm.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("superAdmin.cities.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
