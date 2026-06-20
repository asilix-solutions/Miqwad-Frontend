/**
 * @file CancelOrderDialog.tsx
 *
 * Danger-confirm dialog for cancelling an order.
 * Accepts an optional cancellation reason, then calls useCancelOrderMutation.
 * Toast feedback lives here; the mutation hook is silent.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog, ProviderTextarea } from "@shared/provider-ui";
import { useCancelOrderMutation } from "../hooks/useDealerMutations";
import { useToast } from "@shared/components/ui/toastContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CancelOrderDialog({ orderId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const cancelMutation = useCancelOrderMutation();
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    try {
      await cancelMutation.mutateAsync({
        id: orderId,
        reason: reason.trim() || undefined,
      });
      toast.success(t("dealer.orders.toasts.cancelSuccess"));
      onOpenChange(false);
    } catch {
      toast.error(t("dealer.orders.toasts.actionFailed"));
    }
  };

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !cancelMutation.isPending && onOpenChange(val)}
      title={t("dealer.orders.cancel.title")}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => { void handleConfirm(); }}
            disabled={cancelMutation.isPending}
            className="bg-[var(--color-danger-500)] text-white hover:bg-[var(--color-danger-600,#c0392b)]"
          >
            {cancelMutation.isPending ? t("common.loading") : t("dealer.orders.cancel.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-50)]"
            aria-hidden
          >
            <XCircle className="h-5 w-5 text-[var(--color-danger-500)]" />
          </div>
          <p className="pt-1 text-sm leading-relaxed text-[var(--color-muted)]">
            {t("dealer.orders.cancel.description")}
          </p>
        </div>

        <ProviderTextarea
          id="cancel-reason"
          label={`${t("dealer.orders.cancel.reason")} (${t("common.optional")})`}
          placeholder={t("dealer.orders.cancel.reasonPlaceholder")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          disabled={cancelMutation.isPending}
        />
      </div>
    </ProviderDialog>
  );
}
