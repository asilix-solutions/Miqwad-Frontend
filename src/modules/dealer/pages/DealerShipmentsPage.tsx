/**
 * @file DealerShipmentsPage.tsx
 *
 * Dealer shipments list — provider design system.
 * Status-tab filter + local search by carrier/tracking, hybrid ProviderDataView,
 * smart row actions driven by nextShipmentStatuses(), and a detail dialog
 * opened on row click (blurBackdrop).
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Truck, RotateCcw } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderStatusPill,
  ProviderDataView,
  ProviderEmptyState,
  ProviderSearchBar,
} from "@shared/provider-ui";
import type { ColumnDef, StatusPillTone } from "@shared/provider-ui";
import { useDealerShipmentsQuery } from "../hooks/useDealerQueries";
import { useUpdateShipmentStatusMutation } from "../hooks/useDealerMutations";
import type { Shipment, ShipmentStatus } from "../types";
import { nextShipmentStatuses } from "../shipmentLifecycle";
import { ShipmentDetailDialog } from "../components/ShipmentDetailDialog";
import { useToast } from "@shared/components/ui/toastContext";

// ── Constants ─────────────────────────────────────────────────────────────────

const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, StatusPillTone> = {
  pending:    "neutral",
  in_transit: "brand",
  delivered:  "success",
  returned:   "danger",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerShipmentsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);

  // ── Server state ──────────────────────────────────────────────────────────
  // Fetch with status filter; search is local (carrier/tracking not queryable in mock)
  const q = useDealerShipmentsQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    pageSize: 100,
  });

  const updateStatusMutation = useUpdateShipmentStatusMutation();

  // ── Local search filter ───────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const rows = q.data?.items ?? [];
    if (!search.trim()) return rows;
    const lc = search.toLowerCase();
    return rows.filter(
      (s) =>
        s.carrier?.toLowerCase().includes(lc) ||
        s.trackingNumber?.toLowerCase().includes(lc) ||
        s.id.toLowerCase().includes(lc),
    );
  }, [q.data?.items, search]);

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

  const shortId = (id: string) => `#${id.slice(-6).toUpperCase()}`;

  // ── Status change handler (list row quick-actions) ────────────────────────
  const handleStatusChange = async (shipment: Shipment, status: ShipmentStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: shipment.id, status });
      if (status === "in_transit") toast.success(t("dealer.shipments.toasts.inTransitSuccess"));
      else if (status === "delivered") toast.success(t("dealer.shipments.toasts.deliveredSuccess"));
      else if (status === "returned") toast.success(t("dealer.shipments.toasts.returnedSuccess"));
    } catch {
      toast.error(t("dealer.shipments.toasts.actionFailed"));
    }
  };

  // ── Status tabs ───────────────────────────────────────────────────────────
  const statusTabs = [
    { value: "all",        label: t("dealer.shipments.filterAll") },
    { value: "pending",    label: t("dealer.status.shipment.pending") },
    { value: "in_transit", label: t("dealer.status.shipment.in_transit") },
    { value: "delivered",  label: t("dealer.status.shipment.delivered") },
    { value: "returned",   label: t("dealer.status.shipment.returned") },
  ];

  // ── Column definitions ────────────────────────────────────────────────────
  const columns: ColumnDef<Shipment>[] = [
    {
      key: "id",
      header: t("dealer.shipments.colShipment"),
      hideOnMobile: true,
      render: (s) => (
        <span className="font-mono text-xs text-[var(--color-muted)]" dir="ltr">
          {shortId(s.id)}
        </span>
      ),
    },
    {
      key: "carrier",
      header: t("dealer.shipments.colCarrier"),
      primary: true,
      render: (s) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-[var(--color-ink-body)]">
            {s.carrier ?? <span className="text-[var(--color-muted)]">—</span>}
          </span>
          <span className="font-mono text-xs text-[var(--color-muted)] md:hidden" dir="ltr">
            {shortId(s.id)}
          </span>
        </div>
      ),
    },
    {
      key: "trackingNumber",
      header: t("dealer.shipments.colTracking"),
      hideOnMobile: true,
      render: (s) =>
        s.trackingNumber ? (
          <span className="font-mono text-xs text-[var(--color-ink-body)]" dir="ltr">
            {s.trackingNumber}
          </span>
        ) : (
          <span className="text-sm text-[var(--color-muted)]">—</span>
        ),
    },
    {
      key: "status",
      header: t("dealer.shipments.colStatus"),
      render: (s) => (
        <ProviderStatusPill
          label={t(`dealer.status.shipment.${s.status}`)}
          tone={SHIPMENT_STATUS_TONE[s.status]}
        />
      ),
    },
    {
      key: "shippedAt",
      header: t("dealer.shipments.colDate"),
      hideOnMobile: true,
      render: (s) => (
        <span className="text-sm text-[var(--color-muted)]">
          {s.shippedAt ? formatDate(s.shippedAt) : "—"}
        </span>
      ),
    },
  ];

  // ── Row actions ───────────────────────────────────────────────────────────
  const rowActions = (s: Shipment) => {
    const next = nextShipmentStatuses(s.status);
    const isMutating = updateStatusMutation.isPending;

    return (
      <div
        className="flex items-center justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {next.includes("in_transit") && (
          <button
            type="button"
            title={t("dealer.shipments.actions.markInTransit")}
            disabled={isMutating}
            onClick={() => { void handleStatusChange(s, "in_transit"); }}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-white bg-[var(--color-brand-orange)] transition-colors hover:bg-[var(--color-brand-orange-hover)] disabled:opacity-40"
          >
            {t("dealer.shipments.actions.markInTransit")}
          </button>
        )}
        {next.includes("delivered") && (
          <button
            type="button"
            title={t("dealer.shipments.actions.markDelivered")}
            disabled={isMutating}
            onClick={() => { void handleStatusChange(s, "delivered"); }}
            className="inline-flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-2.5 text-xs font-semibold text-white bg-[var(--color-success-500)] transition-colors hover:bg-[var(--color-success-600,#27ae60)] disabled:opacity-40"
          >
            {t("dealer.shipments.actions.markDelivered")}
          </button>
        )}
        {next.includes("returned") && (
          <button
            type="button"
            title={t("dealer.shipments.actions.markReturned")}
            disabled={isMutating}
            onClick={() => { void handleStatusChange(s, "returned"); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-danger-500)] transition-colors hover:bg-[var(--color-danger-50)] disabled:opacity-40"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const emptyState = (
    <ProviderEmptyState
      icon={<Truck className="h-8 w-8" aria-hidden />}
      title={t("dealer.shipments.emptyTitle")}
      description={t("dealer.shipments.emptyDescription")}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="provider-fade-up">
        <ProviderPageHeader
          icon={<Truck className="h-5 w-5" aria-hidden />}
          title={t("dealer.shipments.title")}
          subtitle={t("dealer.shipments.subtitle")}
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
          placeholder={t("dealer.shipments.search")}
          className="sm:max-w-xs"
        />
      </div>

      {/* Data view */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <ProviderDataView<Shipment>
          columns={columns}
          rows={filteredRows}
          getRowKey={(s) => s.id}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={emptyState}
          rowActions={rowActions}
          onRowClick={(s) => setDetailShipment(s)}
        />
      </div>

      {/* Deferred-mount detail dialog */}
      {detailShipment && (
        <ShipmentDetailDialog
          shipment={detailShipment}
          open
          onOpenChange={(val) => {
            if (!val) setDetailShipment(null);
          }}
        />
      )}
    </div>
  );
}
