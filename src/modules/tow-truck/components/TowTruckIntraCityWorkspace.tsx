/**
 * @file TowTruckIntraCityWorkspace.tsx
 * @description Dedicated Workspace presentation component for IntraCity Tow Truck Orders.
 * Strictly preserves the established IntraCity layout without redesign (Phase 2D.3 constraint).
 */
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { DriverOperations } from "../hooks/useDriverOperations";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckWorkspaceHeader } from "./TowTruckWorkspaceHeader";
import { TowTruckOperationalSummary } from "./TowTruckOperationalSummary";
import { TowTruckRouteSection } from "./TowTruckRouteSection";
import { TowTruckCustomerVehicleSection } from "./TowTruckCustomerVehicleSection";
import { TowTruckFinanceSection } from "./TowTruckFinanceSection";
import { TowTruckDriverDispatchSection } from "./TowTruckDriverDispatchSection";
import { TowTruckAdditionalInfoSection } from "./TowTruckAdditionalInfoSection";
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
  return (
    <>
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
      />

      {/* 2-Column Responsive Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Column (Route & Driver Dispatch) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <TowTruckRouteSection
            origin={order.origin}
            destination={order.destination}
            sameLocations={order.sameLocations}
            isInterCity={order.isInterCity}
            routeSummary={order.routeSummary}
            intercityDetails={order.intercityDetails}
          />

          <TowTruckDriverDispatchSection
            order={order}
            stale={stale}
            operations={operations}
            onAssignmentDirtyChange={onAssignmentDirtyChange}
            onAssignmentBusyChange={onAssignmentBusyChange}
            onAccountDirtyChange={onAccountDirtyChange}
          />
        </div>

        {/* Secondary Column (Customer, Vehicle, Finances, Notes) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <TowTruckCustomerVehicleSection order={order} />
          <TowTruckFinanceSection order={order} />
          <TowTruckAdditionalInfoSection order={order} />
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      <TowTruckCancelOrderDialog
        order={order}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        cancellation={cancellation}
      />
    </>
  );
}
