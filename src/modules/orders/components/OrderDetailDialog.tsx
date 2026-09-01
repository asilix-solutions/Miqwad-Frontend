/**
 * @file OrderDetailDialog.tsx
 * @description Read-only order detail view, fetched fresh via GET /{id}
 * (useOrder → adaptRawOrderDetail) so amounts/status/address reflect the
 * latest state even if the list row is stale. Redesigned as a compact
 * "order sheet": a tinted identity header (order no. + customer + status/
 * type badges) over grouped, icon-led sections — Customer, Items, Vehicle
 * (salvage), Amounts (mini-invoice with emphasized total), Payment, Address
 * (optional map link), Attachments, Meta. Every section is null-safe: a
 * block with no data is dropped rather than rendered with dashes. RTL-first
 * (logical props only), Radix Dialog primitives kept for focus trap/escape.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  CreditCard,
  ExternalLink,
  MapPin,
  Package,
  Paperclip,
  Car,
  UserRound,
  CalendarClock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@shared/lib/formatDate";
import { formatCurrency } from "@shared/lib/formatCurrency";
import { useOrder } from "../hooks/useOrdersQueries";
import {
  orderTypeToI18nKey,
  paymentMethodToI18nKey,
  paymentStatusToI18nKey,
} from "../lib/orderEnums";
import type { OrderDetail, PaymentStatus } from "../types";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_STATUS_TONE: Record<PaymentStatus, "warning" | "success" | "danger" | "info"> = {
  Pending: "warning",
  Paid: "success",
  Failed: "danger",
  Refunded: "info",
};

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-brand-orange)]">{icon}</span>
        <h3 className="text-xs font-semibold tracking-wide text-[var(--color-muted)]">{title}</h3>
        <span className="h-px flex-1 bg-[var(--color-divider)]" />
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-[var(--color-muted)]">{label}</dt>
      <dd className="text-sm font-medium text-[var(--color-ink-body)]">{value}</dd>
    </div>
  );
}

function DetailBody({ order }: { order: OrderDetail }) {
  const { t, i18n } = useTranslation();
  const money = (v: number) => formatCurrency(v, i18n.language);

  const hasPayment = !!order.paymentMethod || !!order.paymentStatus;
  const hasAmounts = order.totalPrice > 0 || order.subtotal > 0 || order.discountAmount > 0;

  return (
    <div className="space-y-6 py-1">
      {/* Identity header */}
      <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-[Tajawal] text-lg font-bold text-[var(--color-brand-blue)]" dir="ltr">
              #{order.id}
            </p>
            <p className="truncate text-sm text-[var(--color-ink-secondary)]">
              {order.userFullName || t("orders.detail.unknownCustomer")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <OrderStatusBadge status={order.status} />
            <Badge tone="neutral">{t(orderTypeToI18nKey(order.type))}</Badge>
          </div>
        </div>
      </div>

      {/* Customer */}
      <Section icon={<UserRound className="size-4" />} title={t("orders.detail.sections.customer")}>
        <dl className="grid grid-cols-2 gap-3">
          <Field label={t("orders.columns.userFullName")} value={order.userFullName || "—"} />
          <Field label={t("orders.detail.customerId")} value={<span dir="ltr">{order.userId || "—"}</span>} />
        </dl>
      </Section>

      {/* Items (SpareParts) */}
      {order.items.length > 0 && (
        <Section icon={<Package className="size-4" />} title={t("orders.detail.sections.items")}>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--color-divider)] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-ink-body)]">
                    {item.serviceName || "—"}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {item.providerName}
                    {item.providerName ? " · " : ""}
                    {t("orders.detail.qtyByPrice", {
                      qty: item.quantity,
                      price: money(item.unitPrice),
                    })}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-ink-body)]">
                  {money(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Vehicle (Salvage) */}
      {order.vehicle && (
        <Section icon={<Car className="size-4" />} title={t("orders.detail.sections.vehicle")}>
          <dl className="grid grid-cols-2 gap-3">
            {order.vehicle.brandName && (
              <Field label={t("orders.detail.vehicle.brand")} value={order.vehicle.brandName} />
            )}
            {order.vehicle.brandModel && (
              <Field label={t("orders.detail.vehicle.model")} value={order.vehicle.brandModel} />
            )}
            {order.vehicle.brandYear && (
              <Field label={t("orders.detail.vehicle.year")} value={<span dir="ltr">{order.vehicle.brandYear}</span>} />
            )}
            {order.vehicle.piecesName && (
              <Field label={t("orders.detail.vehicle.piece")} value={order.vehicle.piecesName} />
            )}
            {order.vehicle.serialNumber && (
              <Field
                label={t("orders.detail.vehicle.serial")}
                value={<span dir="ltr">{order.vehicle.serialNumber}</span>}
              />
            )}
          </dl>
        </Section>
      )}

      {/* Amounts */}
      {hasAmounts && (
        <Section icon={<Banknote className="size-4" />} title={t("orders.detail.sections.amounts")}>
          <dl className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-divider)] p-4">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-[var(--color-muted)]">{t("orders.detail.subtotal")}</dt>
              <dd className="font-medium text-[var(--color-ink-body)]">{money(order.subtotal)}</dd>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <dt className="text-[var(--color-muted)]">{t("orders.detail.discount")}</dt>
                <dd className="font-medium text-[var(--color-success-500)]">−{money(order.discountAmount)}</dd>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-[var(--color-divider)] pt-3">
              <dt className="text-sm font-semibold text-[var(--color-ink-body)]">{t("orders.detail.total")}</dt>
              <dd className="font-[Tajawal] text-xl font-bold text-[var(--color-brand-orange)]">
                {money(order.totalPrice)}
              </dd>
            </div>
          </dl>
        </Section>
      )}

      {/* Payment */}
      {hasPayment && (
        <Section icon={<CreditCard className="size-4" />} title={t("orders.detail.sections.payment")}>
          <dl className="grid grid-cols-2 gap-3">
            {order.paymentMethod && (
              <Field
                label={t("orders.detail.paymentMethodLabel")}
                value={t(paymentMethodToI18nKey(order.paymentMethod))}
              />
            )}
            {order.paymentStatus && (
              <Field
                label={t("orders.detail.paymentStatusLabel")}
                value={
                  <Badge tone={PAYMENT_STATUS_TONE[order.paymentStatus]}>
                    {t(paymentStatusToI18nKey(order.paymentStatus))}
                  </Badge>
                }
              />
            )}
          </dl>
        </Section>
      )}

      {/* Address */}
      {order.address && (
        <Section icon={<MapPin className="size-4" />} title={t("orders.detail.sections.address")}>
          <dl className="grid grid-cols-2 gap-3">
            {order.address.title && (
              <Field label={t("orders.detail.addressTitle")} value={order.address.title} />
            )}
            {order.address.shortNumber && (
              <Field
                label={t("orders.detail.addressShortNumber")}
                value={<span dir="ltr">{order.address.shortNumber}</span>}
              />
            )}
            {order.address.description && (
              <div className="col-span-2">
                <Field label={t("orders.detail.addressDescription")} value={order.address.description} />
              </div>
            )}
          </dl>
          {order.address.latitude != null && order.address.longitude != null && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${order.address.latitude},${order.address.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange-hover)]"
            >
              <ExternalLink className="size-3.5" />
              {t("orders.detail.viewOnMap")}
            </a>
          )}
        </Section>
      )}

      {/* Attachments */}
      {order.attachments.length > 0 && (
        <Section icon={<Paperclip className="size-4" />} title={t("orders.detail.sections.attachments")}>
          <ul className="space-y-2">
            {order.attachments.map((file) => (
              <li key={file.id}>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-divider)] p-2.5 text-sm text-[var(--color-ink-body)] hover:border-[var(--color-brand-orange)]"
                >
                  <Paperclip className="size-4 shrink-0 text-[var(--color-muted)]" />
                  <span className="truncate">{file.fileName}</span>
                  <ExternalLink className="ms-auto size-3.5 shrink-0 text-[var(--color-muted)]" />
                </a>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Meta */}
      <Section icon={<CalendarClock className="size-4" />} title={t("orders.detail.sections.meta")}>
        <dl className="grid grid-cols-2 gap-3">
          <Field
            label={t("orders.columns.createdAt")}
            value={formatDate(order.createdAt, i18n.language)}
          />
          {order.trackNumber && (
            <Field
              label={t("orders.columns.trackNumber")}
              value={<span dir="ltr">{order.trackNumber}</span>}
            />
          )}
        </dl>
      </Section>
    </div>
  );
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const q = useOrder(orderId ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{t("orders.detail.title")}</DialogTitle>
        </DialogHeader>

        {q.isLoading && (
          <div className="space-y-4 py-2">
            <Skeleton className="h-20 w-full rounded-[var(--radius-md)]" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        )}

        {!q.isLoading && q.isError && (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-[var(--color-muted)]">{t("orders.error")}</p>
            <button
              type="button"
              onClick={() => void q.refetch()}
              className="text-sm font-medium text-[var(--color-brand-orange)] hover:text-[var(--color-brand-orange-hover)]"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {!q.isLoading && !q.isError && q.data && <DetailBody order={q.data} />}
      </DialogContent>
    </Dialog>
  );
}
