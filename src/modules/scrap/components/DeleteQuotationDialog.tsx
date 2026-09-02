/**
 * @file DeleteQuotationDialog.tsx
 *
 * Danger-confirm dialog for deleting a salvage quotation
 * (DELETE /api/request-quotations/{id}). Bilingual, destructive styling;
 * invalidates the quotations list + affected order detail on success.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog } from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { useDeleteQuotationMutation } from "../hooks/useRequestQuotations";
import type { RequestQuotation } from "../types";

interface DeleteQuotationDialogProps {
  quotation: RequestQuotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteQuotationDialog({
  quotation,
  open,
  onOpenChange,
  onDeleted,
}: DeleteQuotationDialogProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteQuotationMutation();

  async function handleConfirm() {
    if (!quotation) return;
    try {
      await deleteMutation.mutateAsync({
        id: quotation.id,
        orderId: quotation.orderId,
      });
      toast.success(t("scrap.offer.deleteSuccess"));
      onOpenChange(false);
      onDeleted?.();
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  }

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}
      title={t("scrap.offer.deleteConfirmTitle")}
      size="sm"
      blurBackdrop
      footer={
        <>
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
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
            className="bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-600,#c0392b)]"
          >
            {deleteMutation.isPending ? t("common.loading") : t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-50)]"
          aria-hidden
        >
          <Trash2 className="h-5 w-5 text-[var(--color-danger-500)]" />
        </div>
        <p className="pt-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {t("scrap.offer.deleteConfirmBody")}
        </p>
      </div>
    </ProviderDialog>
  );
}
