/**
 * @file TowTruckInterCityDispatchSection.tsx
 * @description Dedicated Carrier Assignment & Logistics Operations Section for InterCity Workspace.
 * Preserves all backend mutation contracts and hooks (initial assignment, driver removal,
 * driver account suspension/restoration), strictly enforces the Paid InterCity assignment safeguard,
 * and presents driver operations with long-distance carrier terminology.
 */
import { useTranslation } from "react-i18next";
import { ShieldAlert, Truck } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import type { DriverOperations } from "../hooks/useDriverOperations";
import { TowTruckDispatch } from "./TowTruckDispatch";
import { TowTruckDriverOperations } from "./TowTruckDriverOperations";
import { TowTruckAssignmentBadge } from "./TowTruckStatusBadge";

interface Props {
  order: TowTruckOrder;
  stale: boolean;
  operations: DriverOperations;
  onAssignmentDirtyChange: (dirty: boolean) => void;
  onAssignmentBusyChange: (busy: boolean) => void;
  onAccountDirtyChange: (dirty: boolean) => void;
}

export function TowTruckInterCityDispatchSection({
  order,
  stale,
  operations,
  onAssignmentDirtyChange,
  onAssignmentBusyChange,
  onAccountDirtyChange,
}: Props) {
  const { t } = useTranslation();

  const isPaidInterCity =
    order.isInterCity && (order.paymentCode === 2 || order.paymentStatus === "Paid");

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
            <Truck size={17} className="text-brand-blue" aria-hidden="true" />
            <span>{t("towTruck.intercityDispatchTitle")}</span>
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {t("towTruck.intercityDispatchSubtitle")}
          </p>
        </div>

        <TowTruckAssignmentBadge
          assignment={order.assignment}
          driverName={order.driverName}
        />
      </div>

      {/* Assigned Carrier Details Card */}
      <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 block">
              {t("towTruck.assignedCarrier")}
            </span>
            <p className="font-bold text-ink-900 text-sm mt-0.5">
              {order.assignment === "assigned"
                ? (order.driverName ?? t("towTruck.driverMissing"))
                : t("towTruck.unassignedCarrier")}
            </p>
            {order.driverId && (
              <span className="text-xs text-ink-500">
                {t("towTruck.identity")}: <bdi>#{order.driverId}</bdi>
              </span>
            )}
          </div>

          <span className="text-[11px] text-ink-500 bg-white px-2.5 py-1 rounded-md border border-ink-200">
            {t("towTruck.availability")}
          </span>
        </div>

        <p className="text-[11px] text-ink-500 border-t border-ink-200/60 pt-2">
          {t("towTruck.driverHint")}
        </p>
      </div>

      {/* Driver Operations (Removal & Account Management) */}
      <div className="pt-2">
        <TowTruckDriverOperations
          order={order}
          stale={stale}
          operations={operations}
          onDirtyChange={onAccountDirtyChange}
        />
      </div>

      {/* Paid InterCity Assignment Safeguard Banner */}
      {isPaidInterCity && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-1.5 text-xs text-amber-900 shadow-2xs">
          <div className="font-bold flex items-center gap-2 text-amber-900">
            <ShieldAlert size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
            <span>{t("towTruck.intercityPaidSafeguardTitle")}</span>
          </div>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            {t("towTruck.intercityPaidSafeguardDesc")}
          </p>
        </div>
      )}

      {/* Dispatch Workflow (Initial Assignment & Pricing) */}
      <div className="pt-2 border-t border-ink-200">
        <TowTruckDispatch
          order={order}
          onDirtyChange={onAssignmentDirtyChange}
          onBusyChange={onAssignmentBusyChange}
          operationsBlocked={operations.locked}
          removalHistory={operations.removalHistory}
          stale={stale}
        />
      </div>
    </section>
  );
}
