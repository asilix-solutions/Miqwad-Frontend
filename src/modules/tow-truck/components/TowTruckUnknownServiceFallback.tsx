/**
 * @file TowTruckUnknownServiceFallback.tsx
 * @description Safe read-only fallback workspace when Tow Truck order serviceType is unknown.
 * Provides localized guidance explaining that the service type could not be determined,
 * maintains safe read-only access to verified order information,
 * strictly prevents assignment or quoting actions that could apply wrong business rules,
 * and preserves eligible cancellation actions.
 */
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { TowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckWorkspaceHeader } from "./TowTruckWorkspaceHeader";
import { TowTruckCustomerVehicleSection } from "./TowTruckCustomerVehicleSection";
import { TowTruckFinanceSection } from "./TowTruckFinanceSection";
import { TowTruckRouteSection } from "./TowTruckRouteSection";
import { TowTruckAdditionalInfoSection } from "./TowTruckAdditionalInfoSection";
import { TowTruckCancelOrderDialog } from "./TowTruckCancelOrderDialog";

interface Props {
  order: TowTruckOrder;
  cancellation: TowTruckCancellation;
  isFetching?: boolean;
  dataUpdatedAt?: number;
  onBack: () => void;
  onRefresh: () => void;
  onCancelOrder: () => void;
  cancelDialogOpen: boolean;
  setCancelDialogOpen: (open: boolean) => void;
}

export function TowTruckUnknownServiceFallback({
  order,
  cancellation,
  isFetching = false,
  dataUpdatedAt,
  onBack,
  onRefresh,
  onCancelOrder,
  cancelDialogOpen,
  setCancelDialogOpen,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      {/* Workspace Header */}
      <TowTruckWorkspaceHeader
        order={order}
        onBack={onBack}
        onRefresh={onRefresh}
        onCancelOrder={onCancelOrder}
        isCancelling={cancellation.busy}
        isFetching={isFetching}
        dataUpdatedAt={dataUpdatedAt}
      />

      {/* Unknown Service Type Guidance Banner */}
      <div
        className="rounded-xl border border-warning-300 bg-warning-50 p-4.5 space-y-2 text-warning-900 shadow-xs"
        role="alert"
      >
        <div className="flex items-center gap-2.5 font-bold text-sm text-warning-950">
          <ShieldAlert size={18} className="text-warning-600 shrink-0" aria-hidden="true" />
          <span>{t("towTruck.unknownServiceTypeTitle")}</span>
        </div>
        <p className="text-xs text-warning-800 leading-relaxed">
          {t("towTruck.unknownServiceTypeDesc")}
        </p>
        <p className="text-xs text-warning-900 font-medium leading-relaxed bg-white/70 p-3 rounded-lg border border-warning-200">
          {t("towTruck.unknownServiceSafeModeNotice")}
        </p>
      </div>

      {/* Safe Read-Only Grid: Route, Customer/Vehicle, Finance, Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <TowTruckRouteSection
            origin={order.origin}
            destination={order.destination}
            sameLocations={order.sameLocations}
            isInterCity={false}
          />
          <TowTruckAdditionalInfoSection order={order} />
        </div>

        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <TowTruckCustomerVehicleSection order={order} />
          <TowTruckFinanceSection order={order} />
        </div>
      </div>

      {/* Cancellation Confirmation Dialog (Preserved when eligible) */}
      <TowTruckCancelOrderDialog
        order={order}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        cancellation={cancellation}
      />
    </>
  );
}
