/**
 * @file TowTruckInterCityDispatchSection.tsx
 * @description Dedicated Carrier Assignment & Logistics Operations Section for InterCity Workspace.
 * Preserves all backend mutation contracts and hooks (initial assignment, driver removal,
 * driver account suspension/restoration), strictly enforces the Paid InterCity assignment safeguard,
 * and presents driver operations with long-distance carrier terminology.
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

export function TowTruckInterCityDispatchSection({
  order,
  stale,
  operations,
  onAssignmentDirtyChange,
  onAssignmentBusyChange,
  onAccountDirtyChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="border-ink-200 space-y-5 rounded-2xl border bg-white p-5 shadow-xs lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-ink-900 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <Truck size={17} className="text-brand-blue" aria-hidden="true" />
            <span>{t("towTruck.intercityDispatchTitle")}</span>
          </h3>
          <p className="text-ink-500 mt-0.5 text-xs">{t("towTruck.intercityDispatchSubtitle")}</p>
        </div>

        <TowTruckAssignmentBadge assignment={order.assignment} driverName={order.driverName} />
      </div>

      {/* Assigned Carrier Details Card */}
      <div className="border-ink-200 bg-ink-50/40 space-y-2 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="text-ink-500 block text-[11px] font-bold tracking-wider uppercase">
              {t("towTruck.assignedCarrier")}
            </span>
            <p className="text-ink-900 mt-0.5 text-sm font-bold">
              {order.assignment === "assigned"
                ? (order.driverName ?? t("towTruck.driverMissing"))
                : t("towTruck.unassignedCarrier")}
            </p>
            {order.driverId && (
              <span className="text-ink-500 text-xs">
                {t("towTruck.identity")}: <bdi>#{order.driverId}</bdi>
              </span>
            )}
          </div>

          <span className="text-ink-500 border-ink-200 rounded-md border bg-white px-2.5 py-1 text-[11px]">
            {t("towTruck.availability")}
          </span>
        </div>

        <p className="text-ink-500 border-ink-200/60 border-t pt-2 text-[11px]">
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
      <div className="border-ink-200 border-t pt-2">
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
