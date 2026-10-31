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
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { DriverOperations } from "../hooks/useDriverOperations";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckInterCityHeader } from "./TowTruckInterCityHeader";
import { TowTruckOperationalSummary } from "./TowTruckOperationalSummary";
import { TowTruckInterCityCorridorSection } from "./TowTruckInterCityCorridorSection";
import { TowTruckInterCityPartiesSection } from "./TowTruckInterCityPartiesSection";
import { TowTruckInterCityVehicleSection } from "./TowTruckInterCityVehicleSection";
import { TowTruckInterCityFinanceSection } from "./TowTruckInterCityFinanceSection";
import { TowTruckInterCityDispatchSection } from "./TowTruckInterCityDispatchSection";
import { TowTruckAdditionalInfoSection } from "./TowTruckAdditionalInfoSection";
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
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const availableRoadsQuery = useAvailableRoadsQuery();

  const selectedCorridorId = order.intercityDetails.roadId
    ? Number(order.intercityDetails.roadId)
    : null;

  return (
    <>
      {/* 1. Journey-Oriented Header */}
      <TowTruckInterCityHeader
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
      />

      {/* 3. Purpose-Built 2-Column Responsive Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Logistical Column (Corridor, Parties, Carrier Dispatch) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <TowTruckInterCityCorridorSection
            order={order}
            onOpenNetworkModal={() => setNetworkModalOpen(true)}
          />

          <TowTruckInterCityPartiesSection order={order} />

          <TowTruckInterCityDispatchSection
            order={order}
            stale={stale}
            operations={operations}
            onAssignmentDirtyChange={onAssignmentDirtyChange}
            onAssignmentBusyChange={onAssignmentBusyChange}
            onAccountDirtyChange={onAccountDirtyChange}
          />
        </div>

        {/* Secondary Supporting Column (Cargo Vehicle, Finances, Notes & Attachments) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <TowTruckInterCityVehicleSection order={order} />

          <TowTruckInterCityFinanceSection order={order} />

          <TowTruckAdditionalInfoSection order={order} />
        </div>
      </div>

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
    </>
  );
}
