/** Lifted to shared. */
import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type StatusBadgeKind = "user" | "provider" | "subscription" | "notification" | "campaign" | "audit" | "complaint" | "order" | "shipment" | "productStatus";

export interface StatusBadgeProps {
  status: string;
  kind: StatusBadgeKind;
  className?: string;
}

const USER_STATUS_TONES: Record<string, BadgeTone> = {
  active: "success",
  suspended: "danger",
  pending: "warning",
};

const PROVIDER_STATUS_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const SUBSCRIPTION_STATUS_TONES: Record<string, BadgeTone> = {
  active: "success",
  expired: "neutral",
  cancelled: "danger",
  pending: "warning",
};

const NOTIFICATION_STATUS_TONES: Record<string, BadgeTone> = {
  sent: "success",
  pending: "warning",
  failed: "danger",
};

const CAMPAIGN_STATUS_TONES: Record<string, BadgeTone> = {
  draft: "neutral",
  scheduled: "info",
  active: "success",
  paused: "warning",
  ended: "neutral",
};

const AUDIT_ACTION_TONES: Record<string, BadgeTone> = {
  create: "success", update: "info", delete: "danger", approve: "success",
  reject: "danger", resolve: "success", suspend: "danger", restore: "success",
  send: "info", cancel: "warning", login: "neutral",
};

const COMPLAINT_STATUS_TONES: Record<string, BadgeTone> = {
  new: "warning",
  under_review: "info",
  resolved: "success",
};

const ORDER_STATUS_TONES: Record<string, BadgeTone> = {
  new: "info",
  preparing: "warning",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const SHIPMENT_STATUS_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  in_transit: "info",
  delivered: "success",
  returned: "neutral",
};

const PRODUCT_STATUS_TONES: Record<string, BadgeTone> = {
  active: "success",
  draft: "neutral",
  out_of_stock: "warning",
  archived: "neutral",
};

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const toneMap = 
    kind === "user" ? USER_STATUS_TONES 
    : kind === "provider" ? PROVIDER_STATUS_TONES 
    : kind === "subscription" ? SUBSCRIPTION_STATUS_TONES
    : kind === "notification" ? NOTIFICATION_STATUS_TONES
    : kind === "campaign" ? CAMPAIGN_STATUS_TONES
    : kind === "complaint" ? COMPLAINT_STATUS_TONES
    : kind === "order" ? ORDER_STATUS_TONES
    : kind === "shipment" ? SHIPMENT_STATUS_TONES
    : kind === "productStatus" ? PRODUCT_STATUS_TONES
    : AUDIT_ACTION_TONES;
    
  const tone = toneMap[status] || "neutral";

  const i18nKey =
    kind === "user"
      ? `superAdmin.users.status.${status}`
      : kind === "provider"
      ? `superAdmin.providers.status.${status}`
      : kind === "subscription"
      ? `superAdmin.subscriptions.status.${status}`
      : kind === "notification"
      ? `superAdmin.notifications.history.status.${status}`
      : kind === "campaign"
      ? `superAdmin.ads.status.${status}`
      : kind === "complaint"
      ? `superAdmin.complaints.status.${status}`
      : kind === "order"
      ? `dealer.status.order.${status}`
      : kind === "shipment"
      ? `dealer.status.shipment.${status}`
      : kind === "productStatus"
      ? `dealer.status.product.${status}`
      : `superAdmin.audit.actions.${status}`;

  return (
    <Badge tone={tone} className={className}>
      {t(i18nKey)}
    </Badge>
  );
}
