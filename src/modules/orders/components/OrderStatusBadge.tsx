/**
 * @file OrderStatusBadge.tsx
 * @description Colored status badge for orders — a muted, theme-consistent
 * tone per OrderStatus with a small leading dot, per the Phase 2 visual
 * polish spec (InWaiting=neutral, Ready=info, Shipped=brand/orange,
 * Received=success, Canceled=danger).
 */
import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { orderStatusToI18nKey } from "../lib/orderEnums";
import type { OrderStatus } from "../types";

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  InWaiting: "neutral",
  Ready: "info",
  Shipped: "brand",
  Received: "success",
  Canceled: "danger",
};

const DOT_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-ink-400",
  brand: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
};

interface Props {
  status: OrderStatus | string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: Props) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[status as OrderStatus] ?? "neutral";

  return (
    <Badge tone={tone} className={className}>
      <span className={`size-1.5 rounded-full ${DOT_CLASS[tone]}`} />
      {t(orderStatusToI18nKey(status))}
    </Badge>
  );
}
