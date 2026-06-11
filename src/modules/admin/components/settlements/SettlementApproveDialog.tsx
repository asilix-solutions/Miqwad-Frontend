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
import { useApproveSettlementMutation } from "../../hooks/useAdminQueries";
import type { SettlementRecord } from "../../types";

interface Props {
  open: boolean;
  settlement: SettlementRecord | null;
  onOpenChange: (open: boolean) => void;
}

export function SettlementApproveDialog({
  open,
  settlement,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useApproveSettlementMutation();

  const handleApprove = async () => {
    if (!settlement) return;
    try {
      await mutation.mutateAsync(settlement.id);
      toast.success(t("superAdmin.finance.settlements.approveConfirm.success"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const submitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("superAdmin.finance.settlements.approveConfirm.title")}</DialogTitle>
          {settlement && (
            <DialogDescription>
              {t("superAdmin.finance.settlements.approveConfirm.description", {
                amount: t("common.priceSar", { amount: settlement.amount.toLocaleString("en-US") }),
                provider: settlement.providerName,
              })}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("superAdmin.finance.settlements.approveConfirm.cancel")}
          </Button>
          <Button variant="secondary" onClick={handleApprove} disabled={submitting}>
            {submitting ? t("common.loading") : t("superAdmin.finance.settlements.approveConfirm.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
