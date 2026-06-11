import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ProviderDocument } from "@modules/providers/types";

interface Props {
  document: ProviderDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({ document, open, onOpenChange }: Props) {
  const { t } = useTranslation();

  if (!document) return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(document.url) || 
                  document.url.startsWith("data:image/");
  const isPdf = /\.pdf$/i.test(document.url) || document.url.startsWith("data:application/pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle>{t(`providers.kyc.${document.type}` as const)} - {document.fileName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4 bg-neutral-100 flex items-center justify-center">
          {!document.url ? (
            <p className="text-neutral-500">{t("common.none")}</p>
          ) : isImage ? (
            <img
              src={document.url}
              alt={document.fileName}
              className="max-w-full max-h-full object-contain rounded-[var(--radius-sm)]"
            />
          ) : isPdf ? (
            <iframe
              src={document.url}
              title={document.fileName}
              className="w-full h-full rounded-[var(--radius-sm)] bg-white border"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-neutral-600">
              <p>{t("superAdmin.providers.detail.documentViewer.download")}</p>
              <Button asChild>
                <a href={document.url} download={document.fileName} target="_blank" rel="noreferrer">
                  {t("superAdmin.providers.detail.documentViewer.open")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
