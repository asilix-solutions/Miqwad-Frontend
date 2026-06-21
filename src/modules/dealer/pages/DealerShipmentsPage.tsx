/**
 * @file DealerShipmentsPage.tsx
 *
 * Dealer shipments list — provider design system.
 * Status-tab filter + local search by carrier/tracking number,
 * ShipmentList of tracking-style ShipmentCards with status progress,
 * smart actions driven by nextShipmentStatuses(), and a detail dialog
 * opened on card click (blurBackdrop). All query/mutation logic is unchanged.
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Truck } from "lucide-react";
import {
  ProviderPageHeader,
  ProviderTabs,
  ProviderEmptyState,
  ProviderSearchBar,
} from "@shared/provider-ui";
import { useDealerShipmentsQuery } from "../hooks/useDealerQueries";
import { useUpdateShipmentStatusMutation } from "../hooks/useDealerMutations";
import type { Shipment, ShipmentStatus } from "../types";
import { ShipmentDetailDialog } from "../components/ShipmentDetailDialog";
import { ShipmentList } from "../components/ShipmentList";
import { useToast } from "@shared/components/ui/toastContext";

// ── Component ─────────────────────────────────────────────────────────────────

export function DealerShipmentsPage() {
  const { t } = useTranslation();
  const toast = useToast();

  // ── Filter state ──────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);

  // ── Server state ──────────────────────────────────────────────────────
  // Fetch with status filter; search is local (carrier/tracking not queryable in mock)
  const q = useDealerShipmentsQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    pageSize: 100,
  });

  const updateStatusMutation = useUpdateShipmentStatusMutation();

  // ── Local search filter ───────────────────────────────────────────────
  const filteredShipments = useMemo(() => {
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

  // ── Status change handler ─────────────────────────────────────────────
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

  // ── Status tabs ───────────────────────────────────────────────────────
  const statusTabs = [
    { value: "all",        label: t("dealer.shipments.filterAll") },
    { value: "pending",    label: t("dealer.status.shipment.pending") },
    { value: "in_transit", label: t("dealer.status.shipment.in_transit") },
    { value: "delivered",  label: t("dealer.status.shipment.delivered") },
    { value: "returned",   label: t("dealer.status.shipment.returned") },
  ];

  // ── Render ────────────────────────────────────────────────────────────
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

      {/* Shipment tracking cards */}
      <div
        className="provider-fade-up"
        style={{ animationDelay: "80ms" }}
      >
        <ShipmentList
          shipments={filteredShipments}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => { void q.refetch(); }}
          emptyState={
            <ProviderEmptyState
              icon={<Truck className="h-8 w-8" aria-hidden />}
              title={t("dealer.shipments.emptyTitle")}
              description={t("dealer.shipments.emptyDescription")}
            />
          }
          onStatusChange={(shipment, status) => { void handleStatusChange(shipment, status); }}
          onCardClick={setDetailShipment}
          isStatusPending={updateStatusMutation.isPending}
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
