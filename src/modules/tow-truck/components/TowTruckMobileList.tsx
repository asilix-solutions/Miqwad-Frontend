/**
 * @file TowTruckMobileList.tsx
 * @description Mobile Operations Queue Cards for Tow Truck Center.
 * Task-oriented, compact card layout with comfortable touch targets (>= 44px),
 * clean Arabic-first typography, and bidirectional isolation for identifiers.
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, MapPin, Phone, Car, AlertTriangle, Route } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { formatTowTruckOrderDate } from "../lib/towTruckDate";
import {
  TowTruckOrderStatusBadge,
  TowTruckPaymentStatusBadge,
  TowTruckAssignmentBadge,
  TowTruckStageBadge,
  TowTruckServiceTypeBadge,
} from "./TowTruckStatusBadge";
import { TowTruckPlateDisplay } from "./TowTruckPlateDisplay";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  orders: TowTruckOrder[];
  selectedOrderId?: string;
  onSelectOrder?: (id: string) => void;
  className?: string;
}

export function TowTruckMobileList({
  orders,
  selectedOrderId,
  onSelectOrder,
  className = "",
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  return (
    <ul className={`space-y-3 list-none p-0 m-0 ${className}`} aria-label={t("towTruck.queue")}>
      {orders.map((order) => {
        const isSelected = selectedOrderId === order.id;
        const dateInfo = formatTowTruckOrderDate(order.createdAt, i18n.language);
        const vehicleName = (isAr ? order.vehicleAr : order.vehicle) ?? order.vehicle;

        return (
          <li key={order.id}>
            <div
              onClick={(e) => {
                if ((e.target as HTMLElement).closest("a, button")) return;
                onSelectOrder?.(order.id);
              }}
              className={`rounded-xl border transition-all p-3.5 bg-white shadow-2xs cursor-pointer ${
                isSelected
                  ? "border-brand-blue ring-1 ring-brand-blue/30 bg-brand-50/20"
                  : "border-ink-200 hover:border-ink-300"
              }`}
            >
              {/* Header: Order Number & Time & Details Action */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-ink-100">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-brand-blue tracking-tight">
                      <bdi>{order.number}</bdi>
                    </span>
                    <TowTruckServiceTypeBadge serviceType={order.serviceType} className="text-[10px] py-0 px-1.5" />
                  </div>
                  {dateInfo.valid ? (
                    <time
                      dateTime={dateInfo.iso ?? undefined}
                      title={dateInfo.absolute}
                      className="text-[11px] text-ink-500 cursor-default"
                    >
                      {dateInfo.relative ?? dateInfo.absolute}
                    </time>
                  ) : (
                    <span className="text-[11px] text-ink-400 italic">
                      {t("towTruck.missing")}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOrder?.(order.id)}
                  className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 rounded-lg bg-brand-blue hover:bg-brand-700 text-white text-xs font-semibold shadow-xs shrink-0 focus-visible:outline-2 focus-visible:outline-brand-blue transition-colors cursor-pointer"
                  aria-label={t("towTruck.open", { number: order.number })}
                >
                  <span>{t("towTruck.quickPreview")}</span>
                  {isAr ? (
                    <ArrowLeft size={15} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={15} aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Route Block */}
              <div className="py-2.5 space-y-1.5 border-b border-ink-100 text-xs">
                {order.isInterCity && order.hasInterCityRoute && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50/90 px-2 py-1 rounded border border-amber-200/80 mb-1 w-fit">
                    <Route size={12} className="text-amber-700 shrink-0" aria-hidden="true" />
                    <span className="truncate">{order.routeSummary}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-info-600" aria-hidden="true" />
                  <span className="text-ink-800 line-clamp-1 leading-snug">
                    <strong className="text-ink-500 font-normal me-1 text-[11px]">
                      {t("towTruck.originShort")}:
                    </strong>
                    {order.origin.title ?? order.origin.description ?? t("towTruck.missing")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 w-2 h-2 mt-1 rounded-[2px] bg-brand-orange" aria-hidden="true" />
                  <span className="text-ink-800 line-clamp-1 leading-snug">
                    <strong className="text-ink-500 font-normal me-1 text-[11px]">
                      {t("towTruck.destination")}:
                    </strong>
                    {order.destination.title ?? order.destination.description ?? t("towTruck.missing")}
                  </span>
                </div>
                {order.sameLocations && (
                  <div className="flex items-center gap-1.5 text-[11px] text-warning-700 bg-warning-50 px-2 py-1 rounded border border-warning-200 mt-1">
                    <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
                    <span>{t("towTruck.routeSame")}</span>
                  </div>
                )}
              </div>

              {/* Vehicle & Customer Info */}
              <div className="py-2.5 flex items-center justify-between gap-2 border-b border-ink-100 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-ink-800 min-w-0">
                  <Car size={14} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <span className="truncate max-w-[140px] font-medium" title={vehicleName ?? undefined}>
                    {vehicleName ?? t("towTruck.vehicleMissing")}
                  </span>
                  <TowTruckPlateDisplay plate={order.plate} />
                </div>

                {order.phone && (
                  <a
                    href={`tel:${order.phone}`}
                    className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-700 text-xs font-medium py-1 px-2 rounded bg-ink-50 min-h-[36px]"
                    title={t("towTruck.contactCustomer")}
                  >
                    <Phone size={12} className="shrink-0" aria-hidden="true" />
                    <bdi>{order.phone}</bdi>
                  </a>
                )}
              </div>

              {/* Status Badges Row */}
              <div className="pt-2.5 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <TowTruckOrderStatusBadge status={order.status} />
                  <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
                  <TowTruckStageBadge stage={order.stage} />
                </div>

                <TowTruckAssignmentBadge
                  assignment={order.assignment}
                  driverName={order.driverName}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
