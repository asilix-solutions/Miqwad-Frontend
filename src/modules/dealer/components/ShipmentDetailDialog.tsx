/**
 * @file ShipmentDetailDialog.tsx
 *
 * Shipment detail view dialog — carrier, tracking, dates, status pill,
 * and smart status-transition actions driven by nextShipmentStatuses().
 * Opened on row click in DealerShipmentsPage.
 * Uses blurBackdrop to match the dealer dialog identity (products/orders).
 */

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Truck, ExternalLink, Package, RotateCcw } from "lucide-react";
import { ProviderDialog, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { useUpdateShipmentStatusMutation } from "../hooks/useDealerMutations";
import type { Shipment, ShipmentStatus } from "../types";
import { nextShipmentStatuses } from "../shipmentLifecycle";
import { useToast } from "@shared/components/ui/toastContext";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShipmentDetailDialogProps {
  shipment: Shipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, StatusPillTone> = {
  pending:    "neutral",
  in_transit: "brand",
  delivered:  "success",
  returned:   "danger",
};

// ── Sub-component ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-divider)] last:border-0">
      <span className="text-sm text-[var(--color-muted)] shrink-0">{label}</span>
      <span
        className={
          mono
            ? "font-mono text-xs text-[var(--color-ink-body)] text-end"
            : "text-sm font-medium text-[var(--color-ink-body)] text-end"
        }
        dir={mono ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ShipmentDetailDialog({ shipment, open, onOpenChange }: ShipmentDetailDialogProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const updateStatusMutation = useUpdateShipmentStatusMutation();

  const next = nextShipmentStatuses(shipment.status);
  const isPending = updateStatusMutation.isPending;

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

  // ── Status change handler ─────────────────────────────────────────────────
  const handleStatusChange = async (status: ShipmentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: shipment.id, status });
      if (status === "in_transit") toast.success(t("dealer.shipments.toasts.inTransitSuccess"));
      else if (status === "delivered") toast.success(t("dealer.shipments.toasts.deliveredSuccess"));
      else if (status === "returned") toast.success(t("dealer.shipments.toasts.returnedSuccess"));
      onOpenChange(false);
    } catch {
      toast.error(t("dealer.shipments.toasts.actionFailed"));
    }
  };

  // ── Action buttons ────────────────────────────────────────────────────────
  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {next.includes("in_transit") && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => { void handleStatusChange("in_transit"); }}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold text-white bg-[var(--color-brand-orange)] transition-colors hover:bg-[var(--color-brand-orange-hover)] disabled:opacity-40"
        >
          <Truck className="me-2 h-4 w-4" aria-hidden />
          {t("dealer.shipments.actions.markInTransit")}
        </button>
      )}
      {next.includes("delivered") && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => { void handleStatusChange("delivered"); }}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold text-white bg-[var(--color-success-500)] transition-colors hover:bg-[var(--color-success-600,#27ae60)] disabled:opacity-40"
        >
          <Package className="me-2 h-4 w-4" aria-hidden />
          {t("dealer.shipments.actions.markDelivered")}
        </button>
      )}
      {next.includes("returned") && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => { void handleStatusChange("returned"); }}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--color-danger-500)] border border-[var(--color-danger-200,#fca5a5)] transition-colors hover:bg-[var(--color-danger-50)] disabled:opacity-40"
        >
          <RotateCcw className="me-1.5 h-3.5 w-3.5" aria-hidden />
          {t("dealer.shipments.actions.markReturned")}
        </button>
      )}
    </div>
  );

  return (
    <ProviderDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${t("dealer.shipments.detail.title")} ${shortId(shipment.id)}`}
      description={formatDate(shipment.createdAt)}
      size="md"
      blurBackdrop
      footer={
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-divider)] px-4 text-sm font-medium text-[var(--color-ink-body)] transition-colors hover:bg-[var(--color-surface-2)]"
        >
          {t("common.close")}
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Status + actions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {t("common.status")}
            </span>
            <ProviderStatusPill
              label={t(`dealer.status.shipment.${shipment.status}`)}
              tone={SHIPMENT_STATUS_TONE[shipment.status]}
            />
          </div>
          {next.length > 0 && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3">
              {actionButtons}
            </div>
          )}
        </div>

        {/* Detail rows */}
        <div className="flex flex-col">
          {/* Order reference */}
          <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--color-divider)]">
            <span className="text-sm text-[var(--color-muted)] shrink-0">
              {t("dealer.shipments.detail.orderId")}
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                void navigate(`/provider/dealer/orders/${shipment.orderId}`);
              }}
              className="inline-flex items-center gap-1 font-mono text-xs text-[var(--color-brand-orange)] hover:underline"
              dir="ltr"
            >
              {shortId(shipment.orderId)}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </button>
          </div>

          <DetailRow
            label={t("dealer.shipments.detail.carrier")}
            value={shipment.carrier ?? t("dealer.shipments.detail.noCarrier")}
          />
          <DetailRow
            label={t("dealer.shipments.detail.trackingNumber")}
            value={shipment.trackingNumber ?? t("dealer.shipments.detail.noTracking")}
            mono={!!shipment.trackingNumber}
          />
          <DetailRow
            label={t("dealer.shipments.detail.shippedAt")}
            value={shipment.shippedAt ? formatDate(shipment.shippedAt) : "—"}
          />
          {shipment.deliveredAt && (
            <DetailRow
              label={t("dealer.shipments.detail.deliveredAt")}
              value={formatDate(shipment.deliveredAt)}
            />
          )}
        </div>
      </div>
    </ProviderDialog>
  );
}
