/**
 * @file TowTruckInterCityVehicleSection.tsx
 * @description Dedicated Transported Vehicle Cargo Section for InterCity Tow Truck Workspace.
 * Presents the transported vehicle as long-distance logistics cargo, showing make, model,
 * year, license plate, chassis/serial number (VIN), and cargo classification without raw placeholders.
 */
import { useTranslation } from "react-i18next";
import { Car, Layers } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { TowTruckPlateDisplay } from "./TowTruckPlateDisplay";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckInterCityVehicleSection({ order }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const vehicleName =
    (isAr ? order.vehicleAr : order.vehicle) ??
    order.vehicle ??
    t("towTruck.vehicleMissing");

  const modelName = isAr
    ? (order.brandModelAr ?? order.brandModel)
    : order.brandModel;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
          <Car size={17} className="text-brand-blue" aria-hidden="true" />
          <span>{t("towTruck.cargoVehicleTitle")}</span>
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t("towTruck.cargoVehicleSubtitle")}
        </p>
      </div>

      {/* Main Cargo Card */}
      <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 space-y-4">
        {/* Cargo Headline */}
        <div className="flex items-start justify-between gap-3 flex-wrap pb-3 border-b border-ink-200/70">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider block">
              {t("towTruck.vehicleCargoClassification")}
            </span>
            <p className="text-base font-bold text-ink-900">
              {vehicleName}
            </p>
            {order.vehicleId && (
              <p className="text-[11px] text-ink-500">
                {t("towTruck.identity")}: <bdi>#{order.vehicleId}</bdi>
              </p>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 border border-brand-200 text-brand-blue text-[11px] font-semibold">
            <Layers size={13} aria-hidden="true" />
            <span>{t("towTruck.vehicleCargoType")}</span>
          </span>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Make */}
          <div className="rounded-lg bg-white border border-ink-200/80 p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-ink-500 uppercase tracking-wider block">
              {t("towTruck.vehicleMake")}
            </span>
            <p className="text-xs font-bold text-ink-900">
              {order.brandName ?? <span className="italic text-ink-400 font-normal">{t("towTruck.missing")}</span>}
            </p>
          </div>

          {/* Model */}
          <div className="rounded-lg bg-white border border-ink-200/80 p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-ink-500 uppercase tracking-wider block">
              {t("towTruck.vehicleModel")}
            </span>
            <p className="text-xs font-bold text-ink-900">
              {modelName ?? <span className="italic text-ink-400 font-normal">{t("towTruck.missing")}</span>}
            </p>
          </div>

          {/* Year */}
          <div className="rounded-lg bg-white border border-ink-200/80 p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-ink-500 uppercase tracking-wider block">
              {t("towTruck.vehicleYear")}
            </span>
            <p className="text-xs font-bold text-ink-900">
              {order.brandYear ?? <span className="italic text-ink-400 font-normal">{t("towTruck.missing")}</span>}
            </p>
          </div>

          {/* Serial Number (VIN) */}
          <div className="rounded-lg bg-white border border-ink-200/80 p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-ink-500 uppercase tracking-wider block">
              {t("towTruck.vehicleVin")}
            </span>
            <p className="text-xs font-mono font-bold text-ink-900 truncate">
              {order.serialNumber ? (
                <bdi dir="ltr">{order.serialNumber}</bdi>
              ) : (
                <span className="italic text-ink-400 font-normal">{t("towTruck.missing")}</span>
              )}
            </p>
          </div>
        </div>

        {/* License Plate Display */}
        <div className="pt-2 border-t border-ink-200/70 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs font-medium text-ink-700">
            {t("towTruck.vehiclePlate")}
          </span>
          <TowTruckPlateDisplay plate={order.plate} />
        </div>
      </div>
    </section>
  );
}
