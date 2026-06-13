import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTemplateMutation } from "../../hooks/useAdminQueries";
import { useToast } from "@shared/components/ui/toastContext";
import type { NotificationTemplate } from "@modules/notifications/types";

interface DeleteTemplateDialogProps {
  template: NotificationTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTemplateDialog({
  template,
  open,
  onOpenChange,
}: DeleteTemplateDialogProps) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteTemplateMutation();

  const isRtl = i18n.language === "ar";
  const name = isRtl ? template.nameAr : template.nameEn;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(template.id);
      toast.success(t("superAdmin.notifications.templates.success.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.errorTitle"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>{t("superAdmin.notifications.templates.delete")}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-[var(--color-ink-body)]">
            {t("superAdmin.notifications.templates.deleteConfirm", { name })}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-danger-500 hover:bg-danger-600 text-white"
          >
            {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
