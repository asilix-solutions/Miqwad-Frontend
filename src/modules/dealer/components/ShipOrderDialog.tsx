/**
 * @file ShipOrderDialog.tsx
 *
 * Dialog for shipping an order from "preparing" → "shipped".
 * Accepts optional carrier and tracking number, then calls useShipOrderMutation.
 * Toast feedback lives here; the mutation hook is silent.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Truck, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderDialog, ProviderInput } from "@shared/provider-ui";
import { useShipOrderMutation } from "../hooks/useDealerMutations";
import { useToast } from "@shared/components/ui/toastContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShipOrderDialog({ orderId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const shipMutation = useShipOrderMutation();

  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleConfirm = async () => {
    try {
      await shipMutation.mutateAsync({
        id: orderId,
        payload: {
          carrier: carrier.trim() || undefined,
          trackingNumber: trackingNumber.trim() || undefined,
        },
      });
      toast.success(t("dealer.orders.toasts.shipSuccess"));
      onOpenChange(false);
    } catch {
      toast.error(t("dealer.orders.toasts.actionFailed"));
    }
  };

  return (
    <ProviderDialog
      open={open}
      onOpenChange={(val) => !shipMutation.isPending && onOpenChange(val)}
      title={t("dealer.orders.ship.title")}
      description={t("dealer.orders.ship.description")}
      size="sm"
      blurBackdrop
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={shipMutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => { void handleConfirm(); }}
            disabled={shipMutation.isPending}
            className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
          >
            {shipMutation.isPending ? t("common.loading") : t("dealer.orders.ship.confirm")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <ProviderInput
          id="ship-carrier"
          label={`${t("dealer.orders.ship.carrier")} (${t("common.optional")})`}
          placeholder={t("dealer.orders.ship.carrierPlaceholder")}
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          leadingIcon={<Truck className="h-4 w-4" aria-hidden />}
          disabled={shipMutation.isPending}
        />
        <ProviderInput
          id="ship-tracking"
          dir="ltr"
          className="text-start"
          label={`${t("dealer.orders.ship.tracking")} (${t("common.optional")})`}
          placeholder={t("dealer.orders.ship.trackingPlaceholder")}
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          leadingIcon={<Hash className="h-4 w-4" aria-hidden />}
          disabled={shipMutation.isPending}
        />
      </div>
    </ProviderDialog>
  );
}
