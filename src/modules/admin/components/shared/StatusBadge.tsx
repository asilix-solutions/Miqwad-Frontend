import { useTranslation } from "react-i18next";
import { Badge, type BadgeTone } from "@/components/ui/badge";

export type StatusBadgeKind = "user" | "provider";

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

export function StatusBadge({ status, kind, className }: StatusBadgeProps) {
  const { t } = useTranslation();

  const toneMap = kind === "user" ? USER_STATUS_TONES : PROVIDER_STATUS_TONES;
  const tone = toneMap[status] || "neutral";

  const i18nKey =
    kind === "user"
      ? `superAdmin.users.status.${status}`
      : `superAdmin.providers.status.${status}`;

  return (
    <Badge tone={tone} className={className}>
      {t(i18nKey)}
    </Badge>
  );
}
