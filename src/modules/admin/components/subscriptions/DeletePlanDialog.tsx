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
import { useDeletePlanMutation } from "../../hooks/useAdminQueries";
import type { SubscriptionPlan } from "@modules/subscriptions/types";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePlanDialog({ plan, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeletePlanMutation();

  const handleConfirm = async () => {
    if (!plan) return;
    try {
      await deleteMutation.mutateAsync(plan.id);
      toast.success(t("superAdmin.plans.success.deleted"));
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
            {t("superAdmin.plans.deleteConfirm.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("superAdmin.plans.deleteConfirm.description", {
              name: plan?.nameAr ?? "",
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("superAdmin.plans.deleteConfirm.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending
              ? t("common.loading")
              : t("superAdmin.plans.deleteConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
