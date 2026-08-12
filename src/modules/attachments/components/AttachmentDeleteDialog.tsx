/**
 * @file AttachmentDeleteDialog.tsx
 * @description Confirm-then-delete dialog for a single attachment.
 */
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteAttachment } from "../hooks/useAttachmentsQueries";
import type { Attachment } from "../types";

interface AttachmentDeleteDialogProps {
  attachment: Attachment | null;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentDeleteDialog({ attachment, onOpenChange }: AttachmentDeleteDialogProps) {
  const { t, i18n } = useTranslation();
  const deleteMutation = useDeleteAttachment();

  if (!attachment) return null;

  const handleConfirm = async () => {
    await deleteMutation.mutateAsync(attachment.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={!!attachment} onOpenChange={onOpenChange}>
      <DialogContent size="sm" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle>{t("attachments.delete.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--color-muted)]">
          {t("attachments.delete.confirm", { name: attachment.originalFileName })}
        </p>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("common.loading") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
