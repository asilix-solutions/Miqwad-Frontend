/**
 * @file TowTruckDriverDispatchSection.tsx
 * @description Driver & Dispatch section for Tow Truck Workspace.
 * Accurately presents assigned driver identity, houses the initial pricing & dispatch workflow,
 * and integrates driver removal and driver account status operations with visual separation.
 */
import { useTranslation } from "react-i18next";
import { Truck } from "lucide-react";
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

export function TowTruckDriverDispatchSection({
  order,
  stale,
  operations,
  onAssignmentDirtyChange,
  onAssignmentBusyChange,
  onAccountDirtyChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
          <Truck size={17} className="text-brand-blue" aria-hidden="true" />
          <span>{t("towTruck.driverAndDispatch")}</span>
        </h3>

        <TowTruckAssignmentBadge
          assignment={order.assignment}
          driverName={order.driverName}
        />
      </div>

      {/* Assigned Driver Details Card */}
      <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 block">
              {t("towTruck.driver")}
            </span>
            <p className="font-bold text-ink-900 text-sm mt-0.5">
              {order.assignment === "assigned"
                ? (order.driverName ?? t("towTruck.driverMissing"))
                : t(`towTruck.${order.assignment}`)}
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
