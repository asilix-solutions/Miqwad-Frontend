/**
 * @file OrderTypeBadge.tsx
 * @description Subtle, muted badge for the order type column — kept
 * visually quiet (outline style) so it doesn't compete with the colored
 * status badge.
 */
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { orderTypeToI18nKey } from "../lib/orderEnums";
import type { OrderType } from "../types";

interface Props {
  type: OrderType | string;
  className?: string;
}

export function OrderTypeBadge({ type, className }: Props) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={className}>
      {t(orderTypeToI18nKey(type))}
    </Badge>
  );
}
