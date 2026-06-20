/**
 * @file DealerOrderDetailPage.tsx
 *
 * Order detail view — customer block, items table, financial summary,
 * shipment info, and smart action buttons driven by nextStatuses().
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingCart, User, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProviderPageHeader,
  ProviderCard,
  ProviderStatusPill,
  ProviderDataView,
  ProviderEmptyState,
  ProviderSkeleton,
} from "@shared/provider-ui";
import type { ColumnDef, StatusPillTone } from "@shared/provider-ui";
import { useDealerOrderQuery, useDealerShipmentsQuery } from "../hooks/useDealerQueries";
import { useUpdateOrderStatusMutation } from "../hooks/useDealerMutations";
import type { OrderItem, OrderStatus } from "../types";
import { nextStatuses } from "../orderLifecycle";
import { ShipOrderDialog } from "../components/ShipOrderDialog";
import { CancelOrderDialog } from "../components/CancelOrderDialog";
import { useToast } from "@shared/components/ui/toastContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const ORDER_STATUS_TONE: Record<OrderStatus, StatusPillTone> = {
  new:       "info",
  preparing: "warning",
  shipped:   "brand",
  delivered: "success",
  cancelled: "danger",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {children}
    </h2>
  );
}

function FinancialRow({
  label,
  value,
  highlighted,
  muted,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          highlighted
            ? "text-base font-bold text-[var(--color-ink-body)]"
            : muted
            ? "text-sm text-[var(--color-muted)]"
            : "text-sm text-[var(--color-ink-body)]"
        }
      >
        {label}
      </span>
      <span
        className={
          highlighted
            ? "text-base font-bold text-[var(--color-brand-orange)] tabular-nums"
            : "text-sm tabular-nums text-[var(--color-ink-body)]"
        }
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerOrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const toast = useToast();

  const { data: order, isLoading, isError } = useDealerOrderQuery(id);
  const { data: shipmentsData } = useDealerShipmentsQuery();
  const updateStatusMutation = useUpdateOrderStatusMutation();

  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isRTL = i18n.dir() === "rtl";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const shortId = (rawId: string) => `#${rawId.slice(-6).toUpperCase()}`;

  // ── Status change handler ─────────────────────────────────────────────────
  const handleStatusChange = async (status: OrderStatus) => {
    if (!order) return;
    try {
      await updateStatusMutation.mutateAsync({ id: order.id, status });
      if (status === "preparing") toast.success(t("dealer.orders.toasts.startPreparingSuccess"));
      else if (status === "delivered") toast.success(t("dealer.orders.toasts.deliveredSuccess"));
    } catch {
      toast.error(t("dealer.orders.toasts.actionFailed"));
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ProviderSkeleton width={80} height={32} variant="block" />
          <ProviderSkeleton width="50%" />
        </div>
        <ProviderCard className="flex flex-col gap-4">
          <ProviderSkeleton width="35%" />
          <ProviderSkeleton width="55%" />
        </ProviderCard>
        <ProviderCard className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProviderSkeleton key={i} width={`${60 + i * 10}%`} />
          ))}
        </ProviderCard>
        <ProviderCard className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProviderSkeleton key={i} width={`${50 + i * 8}%`} />
          ))}
        </ProviderCard>
      </div>
    );
  }

  // ── Error / not-found state ───────────────────────────────────────────────
  if (isError || !order) {
    return (
      <ProviderEmptyState
        icon={<ShoppingCart className="h-8 w-8" aria-hidden />}
        title={t("dealer.orders.detail.notFound")}
        description={t("dealer.orders.detail.notFoundDesc")}
        action={
          <Link to="/provider/dealer/orders">
            <Button variant="outline">
              <BackArrow className="me-2 h-4 w-4" aria-hidden />
              {t("dealer.orders.detail.backToOrders")}
            </Button>
          </Link>
        }
      />
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const next = nextStatuses(order.status);
  const isPending = updateStatusMutation.isPending;
  const shipment = order.shipmentId
    ? (shipmentsData?.items ?? []).find((s) => s.orderId === order.id)
    : undefined;

  // ── Items columns ─────────────────────────────────────────────────────────
  const itemColumns: ColumnDef<OrderItem>[] = [
    {
      key: "product",
      header: t("dealer.orders.detail.colProduct"),
      primary: true,
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--color-ink-body)]">
            {i18n.language === "ar" ? item.nameAr : item.nameEn}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)]" dir="ltr">
            {item.sku}
          </span>
        </div>
      ),
    },
    {
      key: "unitPrice",
      header: t("dealer.orders.detail.colPrice"),
      align: "end",
      hideOnMobile: true,
      render: (item) => (
        <span className="text-sm tabular-nums">{formatCurrency(item.unitPrice)}</span>
      ),
    },
    {
      key: "qty",
      header: t("dealer.orders.detail.colQty"),
      align: "center",
      hideOnMobile: true,
      render: (item) => (
        <span className="text-sm tabular-nums">{item.qty}</span>
      ),
    },
    {
      key: "lineTotal",
      header: t("dealer.orders.detail.colTotal"),
      align: "end",
      render: (item) => (
        <span className="text-sm tabular-nums font-semibold">{formatCurrency(item.lineTotal)}</span>
      ),
    },
  ];

  // ── Smart action buttons ──────────────────────────────────────────────────
  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {next.includes("preparing") && (
        <Button
          type="button"
          disabled={isPending}
          onClick={() => { void handleStatusChange("preparing"); }}
          className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
        >
          {t("dealer.orders.actions.startPreparing")}
        </Button>
      )}
      {next.includes("shipped") && (
        <Button
          type="button"
          onClick={() => setShipOpen(true)}
          className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-hover)]"
        >
          {t("dealer.orders.actions.ship")}
        </Button>
      )}
      {next.includes("delivered") && (
        <Button
          type="button"
          disabled={isPending}
          onClick={() => { void handleStatusChange("delivered"); }}
          className="bg-[var(--color-success-500)] text-white hover:bg-[var(--color-success-600,#27ae60)]"
        >
          {t("dealer.orders.actions.markDelivered")}
        </Button>
      )}
      {next.includes("cancelled") && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setCancelOpen(true)}
          className="border-[var(--color-danger-500)] text-[var(--color-danger-500)] hover:bg-[var(--color-danger-50)]"
        >
          {t("dealer.orders.actions.cancel")}
        </Button>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/provider/dealer/orders"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink-body)]"
      >
        <BackArrow className="h-4 w-4" aria-hidden />
        {t("dealer.orders.detail.backToOrders")}
      </Link>

      {/* Page header */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          title={`${t("dealer.orders.detail.title")} ${shortId(order.id)}`}
          subtitle={formatDate(order.createdAt)}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <ProviderStatusPill
                label={t(`dealer.status.order.${order.status}`)}
                tone={ORDER_STATUS_TONE[order.status]}
              />
              {actionButtons}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Customer block */}
          <ProviderCard className="provider-fade-up" style={{ animationDelay: "40ms" }}>
            <SectionHeading>{t("dealer.orders.detail.customer")}</SectionHeading>
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-500)]"
                aria-hidden
              >
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[var(--color-ink-body)]">
                  {order.customerName}
                </span>
                {order.customerPhone && (
                  <span className="text-sm text-[var(--color-muted)]" dir="ltr">
                    {order.customerPhone}
                  </span>
                )}
              </div>
            </div>
          </ProviderCard>

          {/* Items */}
          <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
            <SectionHeading>{t("dealer.orders.detail.items")}</SectionHeading>
            <ProviderDataView<OrderItem>
              columns={itemColumns}
              rows={order.items}
              getRowKey={(item) => item.productId}
              emptyState={
                <ProviderEmptyState
                  icon={<Package className="h-8 w-8" aria-hidden />}
                  title={t("dealer.orders.emptyTitle")}
                />
              }
            />
          </div>
        </div>

        {/* Right / sidebar column */}
        <div className="flex flex-col gap-6">
          {/* Financial summary */}
          <ProviderCard className="provider-fade-up" style={{ animationDelay: "40ms" }}>
            <SectionHeading>{t("dealer.orders.detail.financial")}</SectionHeading>
            <div className="flex flex-col gap-3">
              <FinancialRow
                label={t("dealer.orders.detail.subtotal")}
                value={formatCurrency(order.subtotal)}
              />
              <FinancialRow
                label={`${t("dealer.orders.detail.commissionRate")} (${order.commissionRate}%)`}
                value={formatCurrency(order.commissionAmount)}
                muted
              />
              <div className="border-t border-[var(--color-divider)] pt-3">
                <FinancialRow
                  label={t("dealer.orders.detail.netToDealer")}
                  value={formatCurrency(order.netToDealer)}
                  highlighted
                />
              </div>
            </div>
          </ProviderCard>

          {/* Shipment info — only when a shipment exists */}
          {order.shipmentId && (
            <ProviderCard className="provider-fade-up" style={{ animationDelay: "80ms" }}>
              <SectionHeading>{t("dealer.orders.detail.shipment")}</SectionHeading>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand-50)] text-[var(--color-brand-500)]"
                    aria-hidden
                  >
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {shipment?.carrier ? (
                      <span className="text-sm font-medium text-[var(--color-ink-body)]">
                        {shipment.carrier}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--color-muted)]">—</span>
                    )}
                    {shipment?.trackingNumber && (
                      <span className="font-mono text-xs text-[var(--color-muted)]" dir="ltr">
                        {shipment.trackingNumber}
                      </span>
                    )}
                  </div>
                </div>

                {shipment?.status && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      {t("common.status")}
                    </span>
                    <ProviderStatusPill
                      label={t(`dealer.status.shipment.${shipment.status}`)}
                      tone={
                        shipment.status === "delivered"
                          ? "success"
                          : shipment.status === "returned"
                          ? "danger"
                          : shipment.status === "in_transit"
                          ? "brand"
                          : "neutral"
                      }
                    />
                  </div>
                )}

                {shipment?.shippedAt && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      {t("dealer.orders.detail.shippedAt")}
                    </span>
                    <span className="text-xs text-[var(--color-ink-body)]">
                      {formatDate(shipment.shippedAt)}
                    </span>
                  </div>
                )}
              </div>
            </ProviderCard>
          )}

          {/* Action buttons (repeated at bottom for mobile convenience) */}
          {next.length > 0 && (
            <div className="provider-fade-up lg:hidden" style={{ animationDelay: "120ms" }}>
              {actionButtons}
            </div>
          )}
        </div>
      </div>

      {/* Deferred-mount dialogs */}
      {shipOpen && (
        <ShipOrderDialog
          orderId={order.id}
          open
          onOpenChange={setShipOpen}
        />
      )}
      {cancelOpen && (
        <CancelOrderDialog
          orderId={order.id}
          open
          onOpenChange={setCancelOpen}
        />
      )}
    </div>
  );
}
