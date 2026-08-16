/**
 * @file OrderDetailDialog.tsx
 * @description Read-only order detail view, fetched fresh via GET /{id}
 * rather than reusing the list row (so status/tracking reflect the latest
 * state even if the list is stale). Status is shown as the same colored
 * badge used in the list for visual consistency.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@shared/lib/formatDate";
import { useOrder } from "../hooks/useOrdersQueries";
import { orderTypeToI18nKey, paymentMethodToI18nKey } from "../lib/orderEnums";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const q = useOrder(orderId ?? "");

  const rows: { label: string; value: ReactNode }[] = q.data
    ? [
        { label: t("orders.columns.trackNumber"), value: q.data.trackNumber || "—" },
        { label: t("orders.columns.userFullName"), value: q.data.userFullName || "—" },
        { label: t("orders.columns.type"), value: t(orderTypeToI18nKey(q.data.type)) },
        { label: t("orders.columns.status"), value: <OrderStatusBadge status={q.data.status} /> },
        { label: t("orders.columns.paymentMethod"), value: t(paymentMethodToI18nKey(q.data.paymentMethod)) },
        { label: t("orders.columns.createdAt"), value: formatDate(q.data.createdAt, i18n.language) },
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("orders.detail.title")}</DialogTitle>
        </DialogHeader>

        {q.isLoading && (
          <div className="space-y-3 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full rounded" />
            ))}
          </div>
        )}

        {!q.isLoading && q.isError && (
          <p className="py-4 text-center text-sm text-[var(--color-muted)]">{t("orders.error")}</p>
        )}

        {!q.isLoading && !q.isError && q.data && (
          <div className="space-y-3 py-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 border-b border-[var(--color-divider)] pb-2 last:border-0">
                <span className="text-sm text-[var(--color-muted)]">{row.label}</span>
                <span className="text-sm font-medium text-[var(--color-ink-body)]">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
