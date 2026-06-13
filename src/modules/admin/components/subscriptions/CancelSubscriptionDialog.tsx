import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCancelSubscriptionMutation } from "../../hooks/useAdminQueries";
import type { ProviderSubscription } from "@modules/subscriptions/types";
import { useToast } from "@shared/components/ui/toastContext";

interface CancelSubscriptionDialogProps {
  subscription: ProviderSubscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelSubscriptionDialog({ subscription, open, onOpenChange }: CancelSubscriptionDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const cancelMutation = useCancelSubscriptionMutation();

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(subscription.id);
      toast.success(t("superAdmin.subscriptions.success.cancelled"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("superAdmin.subscriptions.cancelConfirm.title")}</DialogTitle>
          <DialogDescription className="mt-2">
            {t("superAdmin.subscriptions.cancelConfirm.description", {
              provider: subscription.providerName,
              plan: subscription.planName,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-600)]"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {t("superAdmin.subscriptions.cancelConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
