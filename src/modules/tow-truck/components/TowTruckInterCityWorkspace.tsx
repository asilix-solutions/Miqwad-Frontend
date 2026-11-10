/**
 * @file TowTruckInterCityWorkspace.tsx
 * @description Dedicated Full Order Workspace presentation component for InterCity Tow Truck Orders.
 * Arranged around the long-distance vehicle transport journey:
 * 1. Journey-oriented Header
 * 2. Operational Stage & Next Action Summary
 * 3. Primary Column: Transport Corridor, Sender/Receiver Logistics, Carrier Assignment & Operations
 * 4. Secondary Column: Transported Vehicle Cargo, Financial Record & Reference Tariff, Notes & Attachments
 * 5. On-Demand Transport Network Modal & Cancellation Confirmation Dialog
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { DriverOperations } from "../hooks/useDriverOperations";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckWorkspaceHeader } from "./TowTruckWorkspaceHeader";
import { TowTruckOperationalSummary } from "./TowTruckOperationalSummary";
import { TowTruckInterCityCorridorSection } from "./TowTruckInterCityCorridorSection";
import { TowTruckInterCityPartiesSection } from "./TowTruckInterCityPartiesSection";
import { TowTruckInterCityVehicleSection } from "./TowTruckInterCityVehicleSection";
import { TowTruckInterCityFinanceSection } from "./TowTruckInterCityFinanceSection";
import { TowTruckInterCityDispatchSection } from "./TowTruckInterCityDispatchSection";
import { TowTruckSupportingInformationSheet } from "./TowTruckSupportingInformationSheet";
import { TowTruckDecisionEvidence } from "./TowTruckDecisionEvidence";
import { TowTruckNetworkModal } from "./TowTruckNetworkModal";
import { TowTruckCancelOrderDialog } from "./TowTruckCancelOrderDialog";
import { useAvailableRoadsQuery } from "@modules/admin/hooks/useRoadsQueries";

interface Props {
  order: TowTruckOrder;
  operations: DriverOperations;
  cancellation: TowTruckCancellation;
  isFetching?: boolean;
  stale?: boolean;
  dataUpdatedAt?: number;
  onBack: () => void;
  onRefresh: () => void;
  onCancelOrder: () => void;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
  onAssignmentDirtyChange: (dirty: boolean) => void;
  onAssignmentBusyChange: (busy: boolean) => void;
  onAccountDirtyChange: (dirty: boolean) => void;
}

export function TowTruckInterCityWorkspace({
  order,
  operations,
  cancellation,
  isFetching = false,
  stale = false,
  dataUpdatedAt,
  onBack,
  onRefresh,
  onCancelOrder,
  cancelDialogOpen,
  setCancelDialogOpen,
  onAssignmentDirtyChange,
  onAssignmentBusyChange,
  onAccountDirtyChange,
}: Props) {
  const { t } = useTranslation();
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const availableRoadsQuery = useAvailableRoadsQuery();

  const selectedCorridorId = order.intercityDetails.roadId
    ? Number(order.intercityDetails.roadId)
    : null;

  return (
    <div className="tow-order-layout">
      {/* 1. Journey-Oriented Header */}
      <TowTruckWorkspaceHeader
        order={order}
        onBack={onBack}
        onRefresh={onRefresh}
        onCancelOrder={onCancelOrder}
        isCancelling={cancellation.busy}
        isFetching={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      />

      {/* 2. Operational Stage & Next Action Summary */}
      <TowTruckOperationalSummary
        order={order}
        removalHistory={operations.removalHistory}
        stale={stale}
      />

      {/* The first screen contains actionable evidence and exactly one real action owner.
          Full details remain accessible below without dominating initial scanning. */}
      <div className="tow-p4r-priority">
        <div className="tow-p4r-priority-evidence">
          <TowTruckDecisionEvidence order={order} />
          {Boolean(order.notes?.trim()) && (
            <section className="tow-p4r-unclassified-notes" aria-label={t("towTruck.notes")}>
              <h3>{t("towTruck.notes")}</h3>
              <p>{order.notes}</p>
            </section>
          )}
          <TowTruckSupportingInformationSheet order={order} />
        </div>

        {/* Existing dispatch handlers, journals and mutation guards are mounted ONCE. */}
        <section
          id="tow-order-action"
          className="tow-p4r-priority-action"
          tabIndex={-1}
          aria-label={t("towTruck.p4rActionWorkspace")}
        >
          <TowTruckInterCityDispatchSection
            order={order}
            stale={stale}
            operations={operations}
            onAssignmentDirtyChange={onAssignmentDirtyChange}
            onAssignmentBusyChange={onAssignmentBusyChange}
            onAccountDirtyChange={onAccountDirtyChange}
          />
        </section>
      </div>

      {/* Full read-only record: one explicit disclosure, not a stack of default-open cards.
          Required confirmation evidence remains inside the unchanged action owner. */}
      <details className="tow-p4r-full-record" id="tow-order-record">
        <summary>
          <span>{t("towTruck.p4rFullRecord")}</span>
          <small>{t("towTruck.p4rFullRecordHint")}</small>
        </summary>
        <div className="tow-p4r-record-sections">
          <TowTruckInterCityCorridorSection
            order={order}
            onOpenNetworkModal={() => setNetworkModalOpen(true)}
          />
          <TowTruckInterCityPartiesSection order={order} />
          <TowTruckInterCityVehicleSection order={order} />
          <TowTruckInterCityFinanceSection order={order} />
        </div>
      </details>

      {/* On-Demand Transport Network Modal */}
      <TowTruckNetworkModal
        open={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
        roads={availableRoadsQuery.data ?? []}
        selectedCorridorId={selectedCorridorId}
      />

      {/* Cancellation Confirmation Dialog */}
      <TowTruckCancelOrderDialog
        order={order}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        cancellation={cancellation}
      />
    </div>
  );
}
