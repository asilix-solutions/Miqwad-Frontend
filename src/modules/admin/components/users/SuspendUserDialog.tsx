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
import { useToast } from "@shared/components/ui/toastContext";
import {
  suspendUserSchema,
  type SuspendUserFormValues,
} from "../../schemas/admin.schemas";
import { useSuspendUserMutation } from "../../hooks/useAdminQueries";

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
  const mutation = useSuspendUserMutation();
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
    if (!open) reset({ reason: "" });
  }, [open, reset]);

  const onSubmit = async (values: SuspendUserFormValues) => {
    try {
      await mutation.mutateAsync({ userId, reason: values.reason });
      toast.success(t("superAdmin.users.suspend.success"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
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
