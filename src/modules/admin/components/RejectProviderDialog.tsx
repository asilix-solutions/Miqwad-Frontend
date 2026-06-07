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
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Label } from "@shared/components/ui/label";
import { Textarea } from "@shared/components/ui/textarea";
import {
  rejectProviderSchema,
  type RejectProviderFormValues,
} from "../schemas/admin.schemas";
import type { AdminProvider } from "../types";

interface Props {
  open: boolean;
  provider: AdminProvider | null;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
}

/**
 * Dialog the admin uses to capture a rejection reason before
 * notifying the provider. Reason is required so the provider has
 * actionable feedback when they re-submit.
 */
export function RejectProviderDialog({
  open,
  provider,
  onCancel,
  onConfirm,
  submitting,
}: Props) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectProviderFormValues>({
    resolver: zodResolver(rejectProviderSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!open) reset({ reason: "" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <form onSubmit={handleSubmit((v) => onConfirm(v.reason))} noValidate>
          <DialogHeader>
            <DialogTitle>{t("admin.rejectConfirm")}</DialogTitle>
            {provider && (
              <DialogDescription>{provider.companyName}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reject-reason">{t("admin.rejectReason")}</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              placeholder={t("admin.rejectReasonPlaceholder")}
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? t("common.loading") : t("admin.reject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
