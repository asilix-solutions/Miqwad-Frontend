/**
 * @file TowTruckStatusBadge.tsx
 * @description Status badge components for Tow Truck operations:
 * - Operational Order Status (InWaiting, Ready, Shipped, Received, Canceled)
 * - Payment Status (Paid, Pending, Failed, Refunded, Unknown)
 * - Driver Assignment State (Assigned with Driver name, Unassigned, Unknown)
 * - Stage / Review indicator (checkDetails, review)
 *
 * All badges separate color from meaning, providing explicit text labels and visual dots/icons.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { orderStatusToI18nKey, paymentStatusToI18nKey } from "@modules/orders/lib/orderEnums";
import type { OrderStatus, PaymentStatus } from "@modules/orders/types";

const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  InWaiting: "warning",
  Ready: "info",
  Shipped: "brand",
  Received: "success",
  Canceled: "danger",
};

const ORDER_DOT_COLOR: Record<BadgeTone, string> = {
  warning: "bg-warning-500",
  info: "bg-info-500",
  brand: "bg-brand-500",
  success: "bg-success-500",
  danger: "bg-danger-500",
  neutral: "bg-ink-400",
};

export function TowTruckOrderStatusBadge({
  status,
  className = "",
}: {
  status: OrderStatus | string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const tone = (status && ORDER_STATUS_TONE[status]) || "neutral";
  const label = status ? t(orderStatusToI18nKey(status)) : t("towTruck.statusUnknown");

  return (
    <Badge tone={tone} className={`gap-1.5 font-medium ${className}`}>
      <span className={`size-1.5 rounded-full ${ORDER_DOT_COLOR[tone]}`} aria-hidden="true" />
      <span>{label}</span>
    </Badge>
  );
}

const PAYMENT_TONE: Record<string, { tone: BadgeTone; dot: string }> = {
  Paid: { tone: "success", dot: "bg-success-500" },
  Pending: { tone: "warning", dot: "bg-warning-500" },
  Failed: { tone: "danger", dot: "bg-danger-500" },
  Refunded: { tone: "info", dot: "bg-info-500" },
};

export function TowTruckPaymentStatusBadge({
  paymentStatus,
  className = "",
}: {
  paymentStatus: PaymentStatus | string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const config = (paymentStatus && PAYMENT_TONE[paymentStatus]) || {
    tone: "neutral" as BadgeTone,
    dot: "bg-ink-400",
  };

  const label = paymentStatus
    ? t(paymentStatusToI18nKey(paymentStatus as PaymentStatus))
    : t("towTruck.paymentUnknown");

  return (
    <Badge tone={config.tone} className={`gap-1.5 font-medium ${className}`}>
      {paymentStatus === "Paid" ? (
        <CheckCircle2 size={12} className="text-success-600" aria-hidden="true" />
      ) : paymentStatus === "Pending" ? (
        <Clock size={12} className="text-warning-600" aria-hidden="true" />
      ) : paymentStatus === "Failed" ? (
        <XCircle size={12} className="text-danger-600" aria-hidden="true" />
      ) : (
        <span className={`size-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      )}
      <span>{label}</span>
    </Badge>
  );
}

export function TowTruckAssignmentBadge({
  assignment,
  driverName,
  className = "",
}: {
  assignment: "assigned" | "unassigned" | "unknown" | string;
  driverName?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();

  if (assignment === "assigned") {
    return (
      <Badge tone="brand" className={`gap-1.5 font-medium ${className}`}>
        <Truck size={12} className="text-brand-600" aria-hidden="true" />
        <span className="truncate max-w-[130px]">{driverName ?? t("towTruck.assigned")}</span>
      </Badge>
    );
  }

  if (assignment === "unassigned") {
    return (
      <Badge
        tone="neutral"
        className={`gap-1 border border-dashed border-ink-300 bg-ink-50 text-ink-600 font-normal ${className}`}
      >
        <span className="size-1.5 rounded-full bg-ink-400" aria-hidden="true" />
        <span>{t("towTruck.unassigned")}</span>
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" className={`gap-1 text-ink-500 font-normal ${className}`}>
      <span>{t("towTruck.unknown")}</span>
    </Badge>
  );
}

export function TowTruckStageBadge({
  stage,
  className = "",
}: {
  stage: string;
  className?: string;
}) {
  const { t } = useTranslation();

  if (stage === "checkDetails") {
    return (
      <Badge tone="warning" className={`gap-1 text-xs py-0.5 font-medium ${className}`}>
        <AlertCircle size={12} className="text-warning-600 shrink-0" aria-hidden="true" />
        <span>{t("towTruck.checkDetails")}</span>
      </Badge>
    );
  }

  return null;
}

export function TowTruckServiceTypeBadge({
  serviceType,
  className = "",
}: {
  serviceType: "intracity" | "intercity" | "unknown" | string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation();

  if (serviceType === "intercity") {
    return (
      <Badge
        tone="warning"
        className={`gap-1.5 font-semibold bg-amber-50 text-amber-800 border-amber-300 ${className}`}
      >
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        <span>{t("towTruck.serviceInterCity")}</span>
      </Badge>
    );
  }

  if (serviceType === "intracity") {
    return (
      <Badge
        tone="info"
        className={`gap-1.5 font-medium bg-blue-50 text-blue-800 border-blue-200 ${className}`}
      >
        <span className="size-1.5 rounded-full bg-blue-500" aria-hidden="true" />
        <span>{t("towTruck.serviceIntraCity")}</span>
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" className={`gap-1 font-normal text-ink-500 ${className}`}>
      <span>{t("towTruck.serviceUnknown")}</span>
    </Badge>
  );
}

