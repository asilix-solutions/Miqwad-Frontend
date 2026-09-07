/**
 * Admin "Deactivate user" dialog.
 *
 * Collects a required reason (RHF field `reason`, mapped to the backend's
 * write-only `note` at the call site) and calls the real
 * `PATCH /api/Users/{id}/deactivate` endpoint. The response is a ghost
 * (`data: null`) — state refreshes via query invalidation, never from the
 * mutation result. Backend 400s arrive as a flat, already-localized
 * `errors: string[]` and are surfaced as a form-level banner.
 */
import { useEffect, useState } from "react";
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
import { useToast } from "@shared/components/ui/toastContext";
import { AppError } from "@shared/types/api";
import {
  suspendUserSchema,
  type SuspendUserFormValues,
} from "../../schemas/admin.schemas";
import { useDeactivateUserMutation } from "../../hooks/useAdminQueries";

interface Props {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useDeactivateUserMutation();
  const [banner, setBanner] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendUserFormValues>({
    resolver: zodResolver(suspendUserSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (!open) {
      reset({ reason: "" });
      setBanner(null);
    }
  }, [open, reset]);

  const onSubmit = async (values: SuspendUserFormValues) => {
    setBanner(null);
    try {
      // RHF field is `reason`; the backend contract calls it `note` (write-only).
      await mutation.mutateAsync({ id: Number(userId), note: values.reason });
      toast.success(t("superAdmin.users.suspend.success"));
      onOpenChange(false);
    } catch (err) {
      if (err instanceof AppError && err.errors?.[0]) {
        setBanner(err.errors[0]);
      } else {
        toast.error(t("common.errorTitle"));
      }
    }
  };

  const submitting = mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{t("superAdmin.users.suspend.title")}</DialogTitle>
            <DialogDescription>
              {t("superAdmin.users.suspend.description", { name: userName })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {banner && (
              <p
                role="alert"
                className="rounded-[var(--radius-sm)] bg-danger-50 px-3 py-2 text-xs text-danger-600"
              >
                {banner}
              </p>
            )}
            <Label htmlFor="suspend-reason">{t("superAdmin.users.suspend.reasonLabel")}</Label>
            <Textarea
              id="suspend-reason"
              rows={4}
              placeholder={t("superAdmin.users.suspend.reasonPlaceholder")}
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
              {t("superAdmin.users.suspend.cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              {submitting ? t("common.loading") : t("superAdmin.users.suspend.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
