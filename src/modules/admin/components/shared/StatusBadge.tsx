import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type StatusBadgeKind = "user" | "provider" | "settlement" | "dispute" | "escrow" | "subscription";

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

const SETTLEMENT_STATUS_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const DISPUTE_STATUS_TONES: Record<string, BadgeTone> = {
  open: "warning",
  under_review: "info",
  resolved: "success",
};

const ESCROW_STATUS_TONES: Record<string, BadgeTone> = {
  held: "info",
  released: "success",
  refunded: "neutral",
  disputed: "danger",
};

const SUBSCRIPTION_STATUS_TONES: Record<string, BadgeTone> = {
  active: "success",
  expired: "neutral",
  cancelled: "danger",
  pending: "warning",
};

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const toneMap = 
    kind === "user" ? USER_STATUS_TONES 
    : kind === "provider" ? PROVIDER_STATUS_TONES 
    : kind === "settlement" ? SETTLEMENT_STATUS_TONES
    : kind === "dispute" ? DISPUTE_STATUS_TONES
    : kind === "subscription" ? SUBSCRIPTION_STATUS_TONES
    : ESCROW_STATUS_TONES;
    
  const tone = toneMap[status] || "neutral";

  const i18nKey =
    kind === "user"
      ? `superAdmin.users.status.${status}`
      : kind === "provider"
      ? `superAdmin.providers.status.${status}`
      : kind === "settlement"
      ? `superAdmin.finance.settlementStatus.${status}`
      : kind === "dispute"
      ? `superAdmin.escrow.disputeStatus.${status}`
      : kind === "subscription"
      ? `superAdmin.subscriptions.status.${status}`
      : `superAdmin.escrow.escrowStatus.${status}`;

  return (
    <Badge tone={tone} className={className}>
      {t(i18nKey)}
    </Badge>
  );
}
