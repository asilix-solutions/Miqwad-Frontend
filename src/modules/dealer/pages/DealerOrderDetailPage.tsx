/**
 * @file DealerOrderDetailPage.tsx
 *
 * Dealer order detail — READ-ONLY (Phase B), backed by GET /api/Orders/{id}.
 *
 * Two-column layout: customer + products table (inline-start / visually
 * leading in RTL), financial summary + delivery address (trailing column).
 * Every section is null-safe and hidden when its data is absent
 * (polymorphic-safe, like the Admin detail). No action buttons — the API
 * exposes no status-transition endpoints. Loading skeleton + error retry.
 */

import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingCart, User, Package, MapPin, RotateCw } from "lucide-react";
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
import { useDealerOrderQuery } from "../hooks/useDealerQueries";
import type { OrderItem, OrderStatus } from "../types";
import { formatOrderDate } from "@shared/lib/formatOrderDate";
import { formatOrderMoney } from "../lib/formatOrderMoney";

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

  const { data: order, isLoading, isError, refetch } = useDealerOrderQuery(id);

  const isRTL = i18n.dir() === "rtl";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const money = (v: number) => formatOrderMoney(v, i18n.language);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <ProviderSkeleton width={80} height={32} variant="block" />
          <ProviderSkeleton width="50%" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ProviderCard className="flex flex-col gap-4 lg:col-span-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProviderSkeleton key={i} width={`${55 + i * 8}%`} />
            ))}
          </ProviderCard>
          <ProviderCard className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProviderSkeleton key={i} width={`${60 + i * 10}%`} />
            ))}
          </ProviderCard>
        </div>
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => { void refetch(); }}>
              <RotateCw className="me-2 h-4 w-4" aria-hidden />
              {t("common.retry")}
            </Button>
            <Link to="/provider/dealer/orders">
              <Button variant="ghost">
                <BackArrow className="me-2 h-4 w-4" aria-hidden />
                {t("dealer.orders.detail.backToOrders")}
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  // ── Items columns ─────────────────────────────────────────────────────────
  const itemColumns: ColumnDef<OrderItem>[] = [
    {
      key: "product",
      header: t("dealer.orders.detail.colProduct"),
      primary: true,
      render: (item) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--color-ink-body)]">
            {item.serviceName || "—"}
          </span>
          {item.providerName && (
            <span className="text-xs text-[var(--color-muted)]">{item.providerName}</span>
          )}
        </div>
      ),
    },
    {
      key: "unitPrice",
      header: t("dealer.orders.detail.colPrice"),
      align: "end",
      hideOnMobile: true,
      render: (item) => <span className="text-sm tabular-nums" dir="ltr">{money(item.unitPrice)}</span>,
    },
    {
      key: "quantity",
      header: t("dealer.orders.detail.colQty"),
      align: "center",
      hideOnMobile: true,
      render: (item) => <span className="text-sm tabular-nums">{item.quantity}</span>,
    },
    {
      key: "lineSubtotal",
      header: t("dealer.orders.detail.colTotal"),
      align: "end",
      render: (item) => (
        <span className="text-sm font-semibold tabular-nums" dir="ltr">{money(item.lineSubtotal)}</span>
      ),
    },
  ];

  const { address } = order;
  const hasMap = address?.latitude != null && address?.longitude != null;

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
          title={`${t("dealer.orders.detail.title")} ${order.code}`}
          subtitle={formatOrderDate(order.createdAt, i18n.language)}
          actions={
            <ProviderStatusPill
              label={t(`dealer.status.order.${order.status}`)}
              tone={ORDER_STATUS_TONE[order.status]}
            />
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Customer + products */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {order.customerName && (
            <ProviderCard className="provider-fade-up" style={{ animationDelay: "40ms" }}>
              <SectionHeading>{t("dealer.orders.detail.customer")}</SectionHeading>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)] text-[var(--color-brand-500)]"
                  aria-hidden
                >
                  <User className="h-5 w-5" />
                </div>
                <span className="pt-2.5 text-sm font-semibold text-[var(--color-ink-body)]">
                  {order.customerName}
                </span>
              </div>
            </ProviderCard>
          )}

          <div className="provider-fade-up" style={{ animationDelay: "80ms" }}>
            <SectionHeading>{t("dealer.orders.detail.items")}</SectionHeading>
            <ProviderDataView<OrderItem>
              columns={itemColumns}
              rows={order.items}
              getRowKey={(item) => item.id}
              emptyState={
                <ProviderEmptyState
                  icon={<Package className="h-8 w-8" aria-hidden />}
                  title={t("dealer.orders.detail.noItems")}
                />
              }
            />
          </div>
        </div>

        {/* Financial summary + address */}
        <div className="flex flex-col gap-6">
          <ProviderCard className="provider-fade-up" style={{ animationDelay: "40ms" }}>
            <SectionHeading>{t("dealer.orders.detail.financial")}</SectionHeading>
            <div className="flex flex-col gap-3">
              <FinancialRow label={t("dealer.orders.detail.subtotal")} value={money(order.subtotal)} />
              {order.discountAmount > 0 && (
                <FinancialRow
                  label={t("dealer.orders.detail.discount")}
                  value={`- ${money(order.discountAmount)}`}
                  muted
                />
              )}
              <div className="border-t border-[var(--color-divider)] pt-3">
                <FinancialRow
                  label={t("dealer.orders.detail.total")}
                  value={money(order.totalPrice)}
                  highlighted
                />
              </div>

              {/* TEMP commission / net — front-computed, see lib/orderAdapter.ts */}
              <div className="mt-1 flex flex-col gap-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] p-3">
                <FinancialRow
                  label={`${t("dealer.orders.detail.commissionAmount")} (${order.commissionRate}%)`}
                  value={`- ${money(order.commissionAmount)}`}
                  muted
                />
                <FinancialRow
                  label={t("dealer.orders.detail.netToDealer")}
                  value={money(order.netAmount)}
                />
                <p className="text-xs text-[var(--color-muted)]">
                  {t("dealer.orders.detail.commissionNote")}
                </p>
              </div>
            </div>
          </ProviderCard>

          {address && (
            <ProviderCard className="provider-fade-up" style={{ animationDelay: "80ms" }}>
              <SectionHeading>{t("dealer.orders.detail.address")}</SectionHeading>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-brand-50)] text-[var(--color-brand-500)]"
                  aria-hidden
                >
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  {address.title && (
                    <span className="text-sm font-medium text-[var(--color-ink-body)]">
                      {address.title}
                    </span>
                  )}
                  {address.description && (
                    <span className="text-sm text-[var(--color-muted)]">{address.description}</span>
                  )}
                  {address.shortNumber && (
                    <span className="font-mono text-xs text-[var(--color-muted)]" dir="ltr">
                      {address.shortNumber}
                    </span>
                  )}
                  {hasMap && (
                    <a
                      href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-orange)] hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {t("dealer.orders.detail.viewOnMap")}
                    </a>
                  )}
                </div>
              </div>
            </ProviderCard>
          )}
        </div>
      </div>
    </div>
  );
}
