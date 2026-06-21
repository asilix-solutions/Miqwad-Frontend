/**
 * @file DealerOrdersPage.tsx
 *
 * Dealer orders list — provider design system.
 * Status filter tabs + search, OrderList card stack, and smart actions
 * driven exclusively by nextStatuses() from the order lifecycle helper.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderEmptyState,
  ProviderSearchBar,
} from "@shared/provider-ui";
import { useDealerOrdersQuery } from "../hooks/useDealerQueries";
import { useUpdateOrderStatusMutation } from "../hooks/useDealerMutations";
import type { Order, OrderStatus } from "../types";
import { ShipOrderDialog } from "../components/ShipOrderDialog";
import { CancelOrderDialog } from "../components/CancelOrderDialog";
import { OrderList } from "../components/OrderList";
import { useToast } from "@shared/components/ui/toastContext";

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerOrdersPage() {
  const { t } = useTranslation();
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

      {/* Order card list */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <OrderList
          orders={q.data?.items ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={emptyState}
          onStartPreparing={(o) => { void handleStatusChange(o, "preparing"); }}
          onShip={(o) => setShipOrderId(o.id)}
          onMarkDelivered={(o) => { void handleStatusChange(o, "delivered"); }}
          onCancel={(o) => setCancelOrderId(o.id)}
          isStatusPending={updateStatusMutation.isPending}
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
