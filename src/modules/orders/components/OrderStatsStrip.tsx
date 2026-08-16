/**
 * @file OrderStatsStrip.tsx
 * @description Light, understated stats row above the orders table — total
 * count + a count per status, derived client-side from the currently loaded
 * page (no extra endpoint, per the Phase 2 spec). Clicking a status stat
 * sets the status filter.
 */
import { useTranslation } from "react-i18next";
import { ORDER_STATUS_OPTIONS, orderStatusToI18nKey } from "../lib/orderEnums";
import type { Order, OrderStatus } from "../types";

interface Props {
  items: Order[];
  activeStatus: OrderStatus | "all";
  onStatusClick: (status: OrderStatus | "all") => void;
}

export function OrderStatsStrip({ items, activeStatus, onStatusClick }: Props) {
  const { t } = useTranslation();

  const total = items.length;
  const countByStatus = (status: OrderStatus) => items.filter((o) => o.status === status).length;

  const stats: { key: OrderStatus | "all"; label: string; count: number }[] = [
    { key: "all", label: t("orders.stats.total"), count: total },
    ...ORDER_STATUS_OPTIONS.map((status) => ({
      key: status,
      label: t(orderStatusToI18nKey(status)),
      count: countByStatus(status),
    })),
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((stat) => (
        <button
          type="button"
          key={stat.key}
          onClick={() => onStatusClick(stat.key)}
          className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-start transition-colors duration-150 ${
            activeStatus === stat.key
              ? "border-[var(--color-brand-orange)] bg-[color-mix(in_srgb,var(--color-brand-orange)_8%,var(--color-surface))]"
              : "border-[var(--color-divider)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]"
          }`}
        >
          <span className="text-sm font-semibold text-[var(--color-ink-body)]">{stat.count}</span>
          <span className="text-xs text-[var(--color-muted)]">{stat.label}</span>
        </button>
      ))}
    </div>
  );
}
