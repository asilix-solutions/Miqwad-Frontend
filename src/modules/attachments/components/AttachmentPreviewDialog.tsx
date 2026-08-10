/**
 * @file AttachmentPreviewDialog.tsx
 * @description Preview an attachment's `filePath` (full URL) inline —
 * images render directly, PDFs via an iframe, everything else falls back to
 * a download/open-in-new-tab link.
 */
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "../lib/attachmentAdapter";
import type { Attachment } from "../types";

interface AttachmentPreviewDialogProps {
  attachment: Attachment | null;
  onOpenChange: (open: boolean) => void;
}

export function AttachmentPreviewDialog({ attachment, onOpenChange }: AttachmentPreviewDialogProps) {
  const { t, i18n } = useTranslation();
  if (!attachment) return null;

  return (
    <Dialog open={!!attachment} onOpenChange={onOpenChange}>
      <DialogContent size="lg" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle className="truncate" title={attachment.originalFileName}>
            {attachment.originalFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[60vh] items-center justify-center overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-2)]">
          {attachment.fileKind === "image" && (
            <img src={attachment.filePath} alt={attachment.originalFileName} className="max-h-[60vh] w-auto object-contain" />
          )}
          {attachment.fileKind === "pdf" && (
            <iframe title={attachment.originalFileName} src={attachment.filePath} className="h-[60vh] w-full" />
          )}
          {attachment.fileKind !== "image" && attachment.fileKind !== "pdf" && (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <p className="text-sm text-[var(--color-muted)]">
                {t("attachments.preview.noInlinePreview")} · {formatFileSize(attachment.fileSize)}
              </p>
              <Button asChild variant="outline">
                <a href={attachment.filePath} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  {t("attachments.preview.openInNewTab")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
