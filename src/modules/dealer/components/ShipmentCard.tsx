/**
 * @file ShipmentCard.tsx
 *
 * Dealer-specific shipment card with a logistics/tracking identity.
 * Signature element: a horizontal 3-step status-progress indicator
 * (pending → in_transit → delivered), RTL-aware pure CSS.
 * Card body click opens ShipmentDetailDialog. Smart action buttons
 * are driven exclusively by nextShipmentStatuses() — never hardcoded.
 * Visually distinct from ProductCard (grid/images) and OrderCard (transactional).
 */

import { Fragment } from "react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Truck, RotateCcw } from "lucide-react";
import { ProviderCard, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { Shipment, ShipmentStatus } from "../types";
import { nextShipmentStatuses } from "../shipmentLifecycle";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ShipmentCard}. */
export interface ShipmentCardProps {
  shipment: Shipment;
  onStatusChange: (shipment: Shipment, status: ShipmentStatus) => void;
  onCardClick: (shipment: Shipment) => void;
  /** Pass `updateStatusMutation.isPending` to disable status-change buttons. */
  isStatusPending?: boolean;
  /** CSS style forwarded from the list for stagger animation-delay. */
  style?: CSSProperties;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<ShipmentStatus, StatusPillTone> = {
  pending:    "neutral",
  in_transit: "brand",
  delivered:  "success",
  returned:   "danger",
};

const PROGRESS_STEPS: readonly ShipmentStatus[] = ["pending", "in_transit", "delivered"];

type StepState = "done" | "current" | "future";

function getStepState(step: ShipmentStatus, current: ShipmentStatus): StepState {
  const i = PROGRESS_STEPS.indexOf(step);
  const c = PROGRESS_STEPS.indexOf(current);
  if (i < c) return "done";
  if (i === c) return "current";
  return "future";
}

// ── Sub-component: progress indicator ────────────────────────────────────────

/**
 * Horizontal status progress track.
 * In RTL, flex-row renders items right-to-left so "pending" (DOM index 0)
 * appears on the right and "delivered" (DOM index 2) on the left — correct
 * Arabic reading direction.  Pure CSS; respects prefers-reduced-motion because
 * there are no animations (static fill colors only).
 */
function ShipmentProgress({ status }: { status: ShipmentStatus }) {
  const { t } = useTranslation();

  if (status === "returned") {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-danger-50)] px-3 py-2">
        <RotateCcw
          className="h-3.5 w-3.5 shrink-0 text-[var(--color-danger-500)]"
          aria-hidden
        />
        <span className="text-xs font-medium text-[var(--color-danger-500)]">
          {t("dealer.status.shipment.returned")}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* Row 1: dots connected by lines */}
      <div className="flex items-center">
        {PROGRESS_STEPS.map((step, index) => {
          const state = getStepState(step, status);
          const isLast = index === PROGRESS_STEPS.length - 1;

          return (
            <Fragment key={step}>
              {/* Step dot */}
              <div
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  state === "done" && "bg-[var(--color-success-500)]",
                  state === "current" && [
                    "bg-[var(--color-brand-orange)]",
                    "ring-2 ring-[var(--color-brand-orange)]",
                    "ring-offset-1 ring-offset-[var(--color-surface)]",
                  ],
                  state === "future" && "bg-[var(--color-divider)]",
                )}
              />
              {/* Connector line — filled only when this step is already done */}
              {!isLast && (
                <div
                  className={cn(
                    "h-px flex-1",
                    state === "done"
                      ? "bg-[var(--color-success-500)]"
                      : "bg-[var(--color-divider)]",
                  )}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Row 2: step labels (justify-between aligns each under its dot) */}
      <div className="flex justify-between">
        {PROGRESS_STEPS.map((step) => {
          const state = getStepState(step, status);
          return (
            <span
              key={step}
              className={cn(
                "text-[10px] leading-none",
                state === "future"
                  ? "text-[var(--color-muted)]"
                  : "font-medium text-[var(--color-ink-body)]",
              )}
            >
              {t(`dealer.status.shipment.${step}`)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Dealer shipment card — tracking-style surface with status progress indicator. */
export function ShipmentCard({
  shipment,
  onStatusChange,
  onCardClick,
  isStatusPending,
  style,
}: ShipmentCardProps) {
  const { t, i18n } = useTranslation();
  const next = nextShipmentStatuses(shipment.status);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

  const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

  const cardStyle: CSSProperties = {
    transition:
      "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
    ...style,
  };

  return (
    <ProviderCard
      padded={false}
      style={cardStyle}
      className="provider-fade-up flex cursor-pointer flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]"
      onClick={() => onCardClick(shipment)}
    >
      {/* ── Header: truck icon + IDs / status pill ───────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Truck icon in brand-tinted circular container */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-orange)]"
            aria-hidden
          >
            <Truck className="h-4 w-4" />
          </div>

          {/* Shipment ID + linked order ID (muted) */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="font-mono text-sm font-semibold text-[var(--color-ink-body)]"
              dir="ltr"
            >
              {shortId(shipment.id)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              {t("dealer.shipments.colOrder")}&nbsp;
              <span className="font-mono" dir="ltr">
                {shortId(shipment.orderId)}
              </span>
            </span>
          </div>
        </div>

        {/* Status pill */}
        <ProviderStatusPill
          label={t(`dealer.status.shipment.${shipment.status}`)}
          tone={STATUS_TONE[shipment.status]}
        />
      </div>

      {/* ── Status progress indicator (signature element) ────────────────── */}
      <div className="border-t border-[var(--color-divider)] px-5 py-4">
        <ShipmentProgress status={shipment.status} />
      </div>

      {/* ── Tracking: carrier + tracking number (mono/ltr) + dates ──────── */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-t border-[var(--color-divider)] px-5 py-3">
        {/* Carrier name + tracking number */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--color-muted)]">
            {shipment.carrier ?? t("dealer.shipments.detail.noCarrier")}
          </span>
          <span
            className={cn(
              "font-mono text-xs",
              shipment.trackingNumber
                ? "font-medium text-[var(--color-ink-body)]"
                : "text-[var(--color-muted)]",
            )}
            dir="ltr"
          >
            {shipment.trackingNumber ?? t("dealer.shipments.detail.noTracking")}
          </span>
        </div>

        {/* Dates */}
        <div className="flex flex-col gap-0.5 text-end">
          {shipment.shippedAt && (
            <span className="text-xs text-[var(--color-muted)]">
              {t("dealer.shipments.detail.shippedAt")}:{" "}
              {formatDate(shipment.shippedAt)}
            </span>
          )}
          {shipment.deliveredAt && (
            <span className="text-xs text-[var(--color-muted)]">
              {t("dealer.shipments.detail.deliveredAt")}:{" "}
              {formatDate(shipment.deliveredAt)}
            </span>
          )}
        </div>
      </div>

      {/* ── Action zone — omitted for terminal statuses (delivered/returned) */}
      {next.length > 0 && (
        <div
          className="flex items-center gap-1.5 border-t border-[var(--color-divider)] px-4 py-3"
          onClick={(e) => e.stopPropagation()}
        >
          {next.includes("in_transit") && (
            <button
              type="button"
              disabled={isStatusPending}
              onClick={() => onStatusChange(shipment, "in_transit")}
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)] disabled:opacity-40"
            >
              {t("dealer.shipments.actions.markInTransit")}
            </button>
          )}
          {next.includes("delivered") && (
            <button
              type="button"
              disabled={isStatusPending}
              onClick={() => onStatusChange(shipment, "delivered")}
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-white bg-[var(--color-success-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-success-600,#27ae60)] disabled:opacity-40"
            >
              {t("dealer.shipments.actions.markDelivered")}
            </button>
          )}
          {next.includes("returned") && (
            <button
              type="button"
              title={t("dealer.shipments.actions.markReturned")}
              disabled={isStatusPending}
              onClick={() => onStatusChange(shipment, "returned")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-50)] disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}
    </ProviderCard>
  );
}
