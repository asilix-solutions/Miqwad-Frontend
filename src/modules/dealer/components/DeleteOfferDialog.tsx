/**
 * @file DeleteOfferDialog.tsx
 *
 * Danger-confirm dialog for hard-deleting a dealer offer (`DELETE /api/Offers/
 * {id}` — `200` then `404`). Shows the offer title in the message, calls
 * `useDeleteOffer` (which invalidates the list + detail keys), toasts, then
 * closes. `onDeleted` lets the detail page navigate back to the list.
 */

import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog } from "@shared/provider-ui";
import { useToast } from "@shared/components/ui/toastContext";
import { useDeleteOffer } from "../hooks/useOfferQueries";
import { extractOfferWriteErrors } from "../api/offersApi";
import type { Offer } from "../types";

interface Props {
  offer: Offer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. to navigate away from the detail page). */
  onDeleted?: () => void;
}

export function DeleteOfferDialog({ offer, open, onOpenChange, onDeleted }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteOffer();

  const title = offer?.title || t("dealer.offers.untitled");

  const handleConfirm = async () => {
    if (!offer) return;
    try {
      await deleteMutation.mutateAsync(offer.id);
      toast.success(t("dealer.offers.delete.toastSuccess"));
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      const backendErrors = extractOfferWriteErrors(err);
      toast.error(
        backendErrors.length > 0
          ? backendErrors.join(" • ")
          : t("dealer.offers.delete.toastError"),
      );
    }
  };

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}
      blurBackdrop
      size="sm"
      title={t("dealer.offers.delete.title")}
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("common.loading") : t("dealer.offers.delete.confirm")}
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
          {t("dealer.offers.delete.body", { title })}
        </p>
      </div>
    </ProviderDialog>
  );
}
