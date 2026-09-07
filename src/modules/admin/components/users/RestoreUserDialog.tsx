/**
 * Admin "Reactivate user" dialog.
 *
 * Reasonless confirm — calls the real `PATCH /api/Users/{id}/activate`
 * endpoint (no body). The response is a ghost (`data: null`); state refreshes
 * via query invalidation. Backend 400s arrive as a flat, already-localized
 * `errors: string[]` and are surfaced as a form-level banner.
 */
import { useEffect, useState } from "react";
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
import { AppError } from "@shared/types/api";
import { useActivateUserMutation } from "../../hooks/useAdminQueries";

interface Props {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestoreUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useActivateUserMutation();
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setBanner(null);
  }, [open]);

  const handleRestore = async () => {
    setBanner(null);
    try {
      await mutation.mutateAsync(Number(userId));
      toast.success(t("superAdmin.users.restore.success"));
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
        <DialogHeader>
          <DialogTitle>{t("superAdmin.users.restore.title")}</DialogTitle>
          <DialogDescription>
            {t("superAdmin.users.restore.description", { name: userName })}
          </DialogDescription>
        </DialogHeader>
        {banner && (
          <p
            role="alert"
            className="mt-3 rounded-[var(--radius-sm)] bg-danger-50 px-3 py-2 text-xs text-danger-600"
          >
            {banner}
          </p>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t("superAdmin.users.restore.cancel")}
          </Button>
          <Button variant="secondary" onClick={handleRestore} disabled={submitting}>
            {submitting ? t("common.loading") : t("superAdmin.users.restore.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
