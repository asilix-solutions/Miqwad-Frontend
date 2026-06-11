import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import {
  rejectSettlementSchema,
  type RejectSettlementFormValues,
} from "../../schemas/admin.schemas";
import { useRejectSettlementMutation } from "../../hooks/useAdminQueries";
import { useToast } from "@shared/components/ui/toastContext";
import type { SettlementRecord } from "../../types";

interface Props {
  open: boolean;
  settlement: SettlementRecord | null;
  onOpenChange: (open: boolean) => void;
}

export function SettlementRejectDialog({
  open,
  settlement,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useRejectSettlementMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectSettlementFormValues>({
    resolver: zodResolver(rejectSettlementSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!open) reset({ reason: "" });
  }, [open, reset]);

  const handleConfirm = async (reason: string) => {
    if (!settlement) return;
    try {
      await mutation.mutateAsync({ id: settlement.id, reason });
      toast.success(t("superAdmin.finance.settlements.rejectConfirm.success"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  const submitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent>
        <form onSubmit={handleSubmit((v) => handleConfirm(v.reason))} noValidate>
          <DialogHeader>
            <DialogTitle>{t("superAdmin.finance.settlements.rejectConfirm.title")}</DialogTitle>
            {settlement && (
              <DialogDescription>
                {settlement.providerName} — {t("common.priceSar", { amount: settlement.amount.toLocaleString("en-US") })}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">{t("superAdmin.finance.settlements.rejectConfirm.reason")}</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder={t("superAdmin.finance.settlements.rejectConfirm.reasonPlaceholder")}
              invalid={!!errors.reason}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-danger-500">
                {t(errors.reason.message ?? "common.requiredField")}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("superAdmin.finance.settlements.rejectConfirm.cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? t("common.loading") : t("superAdmin.finance.settlements.rejectConfirm.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
