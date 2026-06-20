/**
 * @file DealerOrdersPage.tsx
 *
 * Dealer orders list — provider design system.
 * Status filter tabs + search, hybrid ProviderDataView, and smart row actions
 * driven exclusively by nextStatuses() from the order lifecycle helper.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Eye, X } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderStatusPill,
  ProviderDataView,
  ProviderEmptyState,
  ProviderSearchBar,
} from "@shared/provider-ui";
import type { ColumnDef, StatusPillTone } from "@shared/provider-ui";
import { useDealerOrdersQuery } from "../hooks/useDealerQueries";
import { useUpdateOrderStatusMutation } from "../hooks/useDealerMutations";
import type { Order, OrderStatus } from "../types";
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

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerOrdersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // ── Server state ──────────────────────────────────────────────────────────
  const q = useDealerOrdersQuery({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const updateStatusMutation = useUpdateOrderStatusMutation();

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

  const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

  // ── Status mutation handler ───────────────────────────────────────────────
  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: order.id, status });
      if (status === "preparing") toast.success(t("dealer.orders.toasts.startPreparingSuccess"));
      else if (status === "delivered") toast.success(t("dealer.orders.toasts.deliveredSuccess"));
    } catch {
      toast.error(t("dealer.orders.toasts.actionFailed"));
    }
  };

  // ── Status tabs ───────────────────────────────────────────────────────────
  const statusTabs = [
    { value: "all",       label: t("dealer.orders.filterAll") },
    { value: "new",       label: t("dealer.status.order.new") },
    { value: "preparing", label: t("dealer.status.order.preparing") },
    { value: "shipped",   label: t("dealer.status.order.shipped") },
    { value: "delivered", label: t("dealer.status.order.delivered") },
    { value: "cancelled", label: t("dealer.status.order.cancelled") },
  ];

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<Order>[] = [
    {
      key: "id",
      header: t("dealer.orders.colOrder"),
      hideOnMobile: true,
      render: (o) => (
        <span className="font-mono text-xs text-[var(--color-muted)]" dir="ltr">
          {shortId(o.id)}
        </span>
      ),
    },
    {
      key: "customer",
      header: t("dealer.orders.colCustomer"),
      primary: true,
      render: (o) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--color-ink-body)]">
            {o.customerName}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] md:hidden" dir="ltr">
            {shortId(o.id)}
          </span>
        </div>
      ),
    },
    {
      key: "items",
      header: t("dealer.orders.colItems"),
      align: "center",
      hideOnMobile: true,
      render: (o) => (
        <span className="text-sm tabular-nums">{o.items.length}</span>
      ),
    },
    {
      key: "subtotal",
      header: t("dealer.orders.colSubtotal"),
      align: "end",
      hideOnMobile: true,
      render: (o) => (
        <span className="text-sm tabular-nums font-medium">
          {formatCurrency(o.subtotal)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("dealer.orders.colStatus"),
      render: (o) => (
        <ProviderStatusPill
          label={t(`dealer.status.order.${o.status}`)}
          tone={ORDER_STATUS_TONE[o.status]}
        />
      ),
    },
    {
      key: "date",
      header: t("dealer.orders.colDate"),
      hideOnMobile: true,
      render: (o) => (
        <span className="text-sm text-[var(--color-muted)]">
          {formatDate(o.createdAt)}
        </span>
      ),
    },
  ];

  // ── Row actions (smart — driven entirely by nextStatuses) ─────────────────
  const rowActions = (o: Order) => {
    const next = nextStatuses(o.status);
    const isPending = updateStatusMutation.isPending;

    return (
      <div
        className="flex items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* View detail */}
        <button
          type="button"
          title={t("dealer.orders.detail.title")}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
          onClick={() => navigate(`/provider/dealer/orders/${o.id}`)}
        >
          <Eye className="h-4 w-4" aria-hidden />
        </button>

        {/* Start Preparing — new → preparing */}
        {next.includes("preparing") && (
          <button
            type="button"
            title={t("dealer.orders.actions.startPreparing")}
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors hover:bg-[var(--color-brand-orange-hover)] disabled:opacity-40"
            onClick={() => { void handleStatusChange(o, "preparing"); }}
          >
            {t("dealer.orders.actions.startPreparing")}
          </button>
        )}

        {/* Ship — preparing → shipped (opens ship dialog) */}
        {next.includes("shipped") && (
          <button
            type="button"
            title={t("dealer.orders.actions.ship")}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors hover:bg-[var(--color-brand-orange-hover)]"
            onClick={() => setShipOrderId(o.id)}
          >
            {t("dealer.orders.actions.ship")}
          </button>
        )}

        {/* Mark Delivered — shipped → delivered */}
        {next.includes("delivered") && (
          <button
            type="button"
            title={t("dealer.orders.actions.markDelivered")}
            disabled={isPending}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-white bg-[var(--color-success-500)] transition-colors hover:bg-[var(--color-success-600,#27ae60)] disabled:opacity-40"
            onClick={() => { void handleStatusChange(o, "delivered"); }}
          >
            {t("dealer.orders.actions.markDelivered")}
          </button>
        )}

        {/* Cancel — new|preparing → cancelled (icon only, danger) */}
        {next.includes("cancelled") && (
          <button
            type="button"
            title={t("dealer.orders.actions.cancel")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors hover:bg-[var(--color-danger-50)]"
            onClick={() => setCancelOrderId(o.id)}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const emptyState = (
    <ProviderEmptyState
      icon={<ShoppingCart className="h-8 w-8" aria-hidden />}
      title={t("dealer.orders.emptyTitle")}
      description={t("dealer.orders.emptyDescription")}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
          title={t("dealer.orders.title")}
          subtitle={t("dealer.orders.subtitle")}
        />
      </div>

      {/* Filters */}
      <div
        className="provider-fade-up flex flex-col gap-3"
        style={{ animationDelay: "40ms" }}
      >
        <ProviderTabs
          tabs={statusTabs}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <ProviderSearchBar
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder={t("dealer.orders.search")}
          className="sm:max-w-xs"
        />
      </div>

      {/* Data view */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <ProviderDataView<Order>
          columns={columns}
          rows={q.data?.items ?? []}
          getRowKey={(o) => o.id}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={emptyState}
          rowActions={rowActions}
        />
      </div>

      {/* Deferred-mount dialogs */}
      {shipOrderId && (
        <ShipOrderDialog
          orderId={shipOrderId}
          open
          onOpenChange={(val) => { if (!val) setShipOrderId(null); }}
        />
      )}

      {cancelOrderId && (
        <CancelOrderDialog
          orderId={cancelOrderId}
          open
          onOpenChange={(val) => { if (!val) setCancelOrderId(null); }}
        />
      )}
    </div>
  );
}
