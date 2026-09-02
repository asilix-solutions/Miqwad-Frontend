/**
 * @file OrderCard.tsx
 *
 * Dealer order card for the orders list — READ-ONLY (Phase B). The live
 * `/api/Orders` backend exposes no status-transition endpoints, so the card
 * carries no action buttons: status is a read-only pill and the whole card
 * navigates to the detail view.
 *
 * Self-contained: formatters + i18n via `useTranslation` internally.
 */

import type { CSSProperties, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, Package, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { ProviderCard, ProviderStatusPill } from "@shared/provider-ui";
import type { StatusPillTone } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { Order, OrderStatus } from "../types";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { formatOrderMoney } from "../lib/formatOrderMoney";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link OrderCard}. */
export interface OrderCardProps {
  order: Order;
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

/** Dealer order card — read-only summary surface for the orders list. */
export function OrderCard({ order, style }: OrderCardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.dir() === "rtl";
  const DetailArrow = isRTL ? ArrowLeft : ArrowRight;

  const goToDetail = () => navigate(`/provider/dealer/orders/${order.id}`);
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToDetail();
    }
  };

  const cardStyle: CSSProperties = {
    transition:
      "transform var(--dur-base) var(--ease-provider), box-shadow var(--dur-base) var(--ease-provider)",
    ...style,
  };

  return (
    <ProviderCard
      padded={false}
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={onKeyDown}
      style={cardStyle}
      className="provider-fade-up flex cursor-pointer flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[var(--shadow-provider-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-orange)]"
    >
      {/* ── Header: code · customer · date / status pill ──────────────────── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span
            className="font-mono text-sm font-semibold text-[var(--color-ink-body)]"
            dir="ltr"
          >
            {order.code}
          </span>

          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <span className="truncate text-xs font-medium text-[var(--color-ink-body)]">
              {order.customerName || t("dealer.orders.unknownCustomer")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)]" aria-hidden />
            <span className="text-xs text-[var(--color-muted)]">
              {formatOrderDate(order.createdAt, i18n.language)}
            </span>
          </div>
        </div>

        <ProviderStatusPill
          label={t(`dealer.status.order.${order.status}`)}
          tone={STATUS_TONE[order.status]}
        />
      </div>

      {/* ── Body: item count + total ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-divider)] px-5 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {order.itemCount}&nbsp;{t("dealer.orders.colItems")}
          </span>
        </div>

        <span
          className={cn(
            "tabular-nums text-base font-bold",
            order.status === "cancelled"
              ? "text-[var(--color-muted)]"
              : "text-[var(--color-brand-orange)]",
          )}
          dir="ltr"
        >
          {formatOrderMoney(order.totalPrice, i18n.language)}
        </span>
      </div>

      {/* ── Footer: view-detail affordance ───────────────────────────────── */}
      <div className="flex items-center justify-end border-t border-[var(--color-divider)] px-4 py-3">
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)]">
          {t("dealer.orders.viewDetail")}
          <DetailArrow className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </ProviderCard>
  );
}
