/**
 * @file TowTruckIntraCityWorkspace.tsx
 * @description Dedicated Workspace presentation component for IntraCity Tow Truck Orders.
 * Strictly preserves the established IntraCity layout without redesign (Phase 2D.3 constraint).
 */
import { useTranslation } from "react-i18next";
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { DriverOperations } from "../hooks/useDriverOperations";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckWorkspaceHeader } from "./TowTruckWorkspaceHeader";
import { TowTruckOperationalSummary } from "./TowTruckOperationalSummary";
import { TowTruckRouteSection } from "./TowTruckRouteSection";
import { TowTruckCustomerVehicleSection } from "./TowTruckCustomerVehicleSection";
import { TowTruckFinanceSection } from "./TowTruckFinanceSection";
import { TowTruckDriverDispatchSection } from "./TowTruckDriverDispatchSection";
import { TowTruckSupportingInformationSheet } from "./TowTruckSupportingInformationSheet";
import { TowTruckDecisionEvidence } from "./TowTruckDecisionEvidence";
import { TowTruckCancelOrderDialog } from "./TowTruckCancelOrderDialog";

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

export function TowTruckIntraCityWorkspace({
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
  return (
    <div className="tow-order-layout">
      {/* Header */}
      <TowTruckWorkspaceHeader
        order={order}
        onBack={onBack}
        onRefresh={onRefresh}
        onCancelOrder={onCancelOrder}
        isCancelling={cancellation.busy}
        isFetching={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      />

      {/* Operational Summary */}
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
          <TowTruckDriverDispatchSection
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
          <TowTruckRouteSection
            origin={order.origin}
            destination={order.destination}
            sameLocations={order.sameLocations}
            isInterCity={order.isInterCity}
            routeSummary={order.routeSummary}
            intercityDetails={order.intercityDetails}
          />
          <TowTruckCustomerVehicleSection order={order} />
          <TowTruckFinanceSection order={order} />
        </div>
      </details>

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
