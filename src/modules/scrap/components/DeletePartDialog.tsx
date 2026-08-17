/**
 * @file DeletePartDialog.tsx
 *
 * Danger-confirm dialog for scrap part deletion.
 * Uses ProviderDialog shell; delete logic is unchanged.
 */

import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog } from "@shared/provider-ui";
import type { ProviderService } from "@shared/provider-services";
import { useDeleteScrapPartMutation } from "../hooks/useScrapPartsQueries";
import { useToast } from "@shared/components/ui/toastContext";

interface Props {
  part: ProviderService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePartDialog({ part, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const deleteMutation = useDeleteScrapPartMutation();

  const handleConfirm = async () => {
    if (!part) return;
    try {
      await deleteMutation.mutateAsync(part.id);
      toast.success(t("common.deleted"));
      onOpenChange(false);
    } catch {
      toast.error(t("common.deleteFailed"));
    }
  };

  const partName = part?.serviceName;

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !deleteMutation.isPending && onOpenChange(val)}
      title={t("scrap.parts.deleteConfirmTitle")}
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
          {t("scrap.parts.deleteConfirmBody", { name: partName })}
        </p>
      </div>
    </ProviderDialog>
  );
}
