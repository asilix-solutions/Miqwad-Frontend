/**
 * @file OrderCard.tsx
 *
 * Dealer-specific order card for the order list view.
 * Self-contained: manages formatters and i18n via useTranslation internally.
 * Smart action buttons are driven exclusively by nextStatuses() from the
 * order lifecycle helper — no prop for "allowed actions" is needed.
 */

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, Package, Calendar, ArrowRight, ArrowLeft, X } from "lucide-react";
import { ProviderCard, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { Order, OrderStatus } from "../types";
import { nextStatuses } from "../orderLifecycle";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link OrderCard}. */
export interface OrderCardProps {
  order: Order;
  onStartPreparing: (order: Order) => void;
  onShip: (order: Order) => void;
  onMarkDelivered: (order: Order) => void;
  onCancel: (order: Order) => void;
  /** Pass `updateStatusMutation.isPending` to disable status-change buttons. */
  isStatusPending?: boolean;
  /** CSS style forwarded from the list for stagger animation-delay. */
  style?: CSSProperties;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TONE: Record<OrderStatus, StatusPillTone> = {
  new:       "info",
  preparing: "warning",
  shipped:   "brand",
  delivered: "success",
  cancelled: "danger",
};

// ── Component ─────────────────────────────────────────────────────────────────

/** Dealer order card — action-oriented surface for the orders list. */
export function OrderCard({
  order,
  onStartPreparing,
  onShip,
  onMarkDelivered,
  onCancel,
  isStatusPending,
  style,
}: OrderCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const next = nextStatuses(order.status);
  const isRTL = i18n.dir() === "rtl";
  const DetailArrow = isRTL ? ArrowLeft : ArrowRight;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

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
      className="provider-fade-up flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)]"
    >
      {/* ── Header: ID · customer · date / status pill ────────────────────── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        {/* Left: order ID + customer name + date */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className="font-mono text-sm font-semibold text-[var(--color-ink-body)]"
            dir="ltr"
          >
            {shortId(order.id)}
          </span>

          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <span className="truncate text-xs font-medium text-[var(--color-ink-body)]">
              {order.customerName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <span className="text-xs text-[var(--color-muted)]">
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Right: status pill */}
        <ProviderStatusPill
          label={t(`dealer.status.order.${order.status}`)}
          tone={STATUS_TONE[order.status]}
        />
      </div>

      {/* ── Body: items count + subtotal ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-divider)] px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {order.items.length}&nbsp;{t("dealer.orders.colItems")}
          </span>
        </div>

        <span
          className={cn(
            "tabular-nums text-base font-bold",
            order.status === "cancelled"
              ? "text-[var(--color-muted)]"
              : "text-[var(--color-brand-orange)]",
          )}
        >
          {formatCurrency(order.subtotal)}
        </span>
      </div>

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-2 border-t border-[var(--color-divider)] px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Smart action buttons — driven by nextStatuses() */}
        <div className="flex flex-wrap items-center gap-1.5">
          {next.includes("preparing") && (
            <button
              type="button"
              disabled={isStatusPending}
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)] disabled:opacity-40"
              onClick={() => onStartPreparing(order)}
            >
              {t("dealer.orders.actions.startPreparing")}
            </button>
          )}

          {next.includes("shipped") && (
            <button
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)]"
              onClick={() => onShip(order)}
            >
              {t("dealer.orders.actions.ship")}
            </button>
          )}

          {next.includes("delivered") && (
            <button
              type="button"
              disabled={isStatusPending}
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-3 text-xs font-semibold text-white bg-[var(--color-success-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-success-600,#27ae60)] disabled:opacity-40"
              onClick={() => onMarkDelivered(order)}
            >
              {t("dealer.orders.actions.markDelivered")}
            </button>
          )}

          {next.includes("cancelled") && (
            <button
              type="button"
              title={t("dealer.orders.actions.cancel")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-50)]"
              onClick={() => onCancel(order)}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>

        {/* View detail link-button */}
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)] transition-colors duration-[var(--dur-fast)] hover:text-[var(--color-brand-orange-hover)]"
          onClick={() => navigate(`/provider/dealer/orders/${order.id}`)}
        >
          {t("dealer.orders.viewDetail")}
          <DetailArrow className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </ProviderCard>
  );
}
