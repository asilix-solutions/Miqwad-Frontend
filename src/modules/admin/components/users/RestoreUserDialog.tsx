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
import { useRestoreUserMutation } from "../../hooks/useAdminQueries";

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
  const mutation = useRestoreUserMutation();

  const handleRestore = async () => {
    try {
      await mutation.mutateAsync(userId);
      toast.success(t("superAdmin.users.restore.success"));
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
          <DialogTitle>{t("superAdmin.users.restore.title")}</DialogTitle>
          <DialogDescription>
            {t("superAdmin.users.restore.description", { name: userName })}
          </DialogDescription>
        </DialogHeader>
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
