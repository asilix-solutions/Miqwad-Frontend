/**
 * @file TowTruckTable.tsx
 * @description Desktop Operations Table for Tow Truck Center.
 * Professional, high-density yet readable table layout optimized for dispatchers.
 * Prioritizes order identity, exact creation timestamps, route verification,
 * vehicle summary, independent order & payment status badges, driver assignment,
 * and clear detail modal trigger.
 */
import { useTranslation } from "react-i18next";
import { ArrowUpRight, MapPin, Phone, AlertTriangle, Route } from "lucide-react";
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

export function TowTruckTable({
  orders,
  selectedOrderId,
  onSelectOrder,
  className = "",
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-ink-200 bg-white shadow-xs ${className}`}
      role="region"
      aria-label={t("towTruck.queue")}
      tabIndex={0}
    >
      <table className="w-full text-start text-xs border-collapse">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/75 text-ink-600 font-semibold select-none">
            <th scope="col" className="py-3.5 px-4 text-start whitespace-nowrap min-w-[130px]">
              {t("towTruck.colOrderTime")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap min-w-[200px]">
              {t("towTruck.colRoute")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap hidden lg:table-cell min-w-[150px]">
              {t("towTruck.colCustomer")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap min-w-[170px]">
              {t("towTruck.colVehicle")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap min-w-[120px]">
              {t("towTruck.colOrderStatus")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap min-w-[115px]">
              {t("towTruck.colPaymentStatus")}
            </th>
            <th scope="col" className="py-3.5 px-3 text-start whitespace-nowrap min-w-[140px]">
              {t("towTruck.colDriver")}
            </th>
            <th scope="col" className="py-3.5 px-4 text-end whitespace-nowrap min-w-[90px]">
              {t("towTruck.colAction")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {orders.map((order) => {
            const isSelected = selectedOrderId === order.id;
            const dateInfo = formatTowTruckOrderDate(order.createdAt, i18n.language);
            const vehicleName = (isAr ? order.vehicleAr : order.vehicle) ?? order.vehicle;

            return (
              <tr
                key={order.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a, button")) return;
                  onSelectOrder?.(order.id);
                }}
                className={`transition-colors cursor-pointer hover:bg-brand-50/40 ${
                  isSelected ? "bg-brand-50/80 font-normal ring-1 ring-inset ring-brand-blue/30" : "bg-white"
                }`}
                data-order-id={order.id}
              >
                {/* 1. Order Identity & Creation Date */}
                <td className="py-3.5 px-4 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-brand-blue tracking-tight">
                      <bdi>{order.number}</bdi>
                    </span>
                    <TowTruckServiceTypeBadge serviceType={order.serviceType} className="w-fit text-[10px] py-0 px-1.5" />
                    {dateInfo.valid ? (
                      <time
                        dateTime={dateInfo.iso ?? undefined}
                        title={dateInfo.absolute}
                        className="text-[11px] text-ink-500 flex flex-col leading-tight cursor-default"
                      >
                        {dateInfo.relative && (
                          <span className="font-medium text-ink-700">{dateInfo.relative}</span>
                        )}
                        <span className="text-[10px] text-ink-400">{dateInfo.absolute}</span>
                      </time>
                    ) : (
                      <span className="text-[11px] text-ink-400 italic">
                        {t("towTruck.missing")}
                      </span>
                    )}
                  </div>
                </td>

                {/* 2. Route (Origin & Destination) */}
                <td className="py-3.5 px-3 align-top">
                  <div className="flex flex-col gap-1.5 max-w-[240px]">
                    {order.isInterCity && order.hasInterCityRoute && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded border border-amber-200/80 w-fit">
                        <Route size={12} className="text-amber-700 shrink-0" aria-hidden="true" />
                        <span className="truncate">{order.routeSummary}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-xs text-ink-800">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-info-600" aria-hidden="true" />
                      <span
                        className="truncate"
                        title={order.origin.title ?? order.origin.description ?? t("towTruck.missing")}
                      >
                        {order.origin.title ?? order.origin.description ?? t("towTruck.missing")}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-ink-800">
                      <span className="shrink-0 w-2 h-2 mt-1 rounded-[2px] bg-brand-orange" aria-hidden="true" />
                      <span
                        className="truncate"
                        title={order.destination.title ?? order.destination.description ?? t("towTruck.missing")}
                      >
                        {order.destination.title ?? order.destination.description ?? t("towTruck.missing")}
                      </span>
                    </div>
                    {/* Route Alert if applicable */}
                    {order.sameLocations && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-warning-700 bg-warning-50 px-1.5 py-0.5 rounded border border-warning-200">
                        <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{t("towTruck.routeSame")}</span>
                      </span>
                    )}
                  </div>
                </td>

                {/* 3. Customer & Phone (Hidden on smaller laptops) */}
                <td className="py-3.5 px-3 align-top hidden lg:table-cell">
                  <div className="flex flex-col gap-1 max-w-[160px]">
                    <span className="font-medium text-ink-900 truncate" title={order.customer ?? undefined}>
                      {order.customer ?? t("towTruck.customerMissing")}
                    </span>
                    {order.phone ? (
                      <a
                        href={`tel:${order.phone}`}
                        className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-700 text-[11px] font-medium transition-colors w-fit"
                        title={t("towTruck.contactCustomer")}
                      >
                        <Phone size={11} className="shrink-0" aria-hidden="true" />
                        <bdi>{order.phone}</bdi>
                      </a>
                    ) : (
                      <span className="text-[11px] text-ink-400 italic">
                        {t("towTruck.contactMissing")}
                      </span>
                    )}
                  </div>
                </td>

                {/* 4. Vehicle & Plate */}
                <td className="py-3.5 px-3 align-top">
                  <div className="flex flex-col items-start gap-1 max-w-[170px]">
                    <span className="font-medium text-ink-800 text-xs truncate" title={vehicleName ?? undefined}>
                      {vehicleName ?? t("towTruck.vehicleMissing")}
                    </span>
                    <TowTruckPlateDisplay plate={order.plate} />
                  </div>
                </td>

                {/* 5. Operational Order Status */}
                <td className="py-3.5 px-3 align-top">
                  <div className="flex flex-col items-start gap-1">
                    <TowTruckOrderStatusBadge status={order.status} />
                    <TowTruckStageBadge stage={order.stage} />
                  </div>
                </td>

                {/* 6. Independent Payment Status */}
                <td className="py-3.5 px-3 align-top">
                  <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
                </td>

                {/* 7. Assigned Driver */}
                <td className="py-3.5 px-3 align-top">
                  <TowTruckAssignmentBadge
                    assignment={order.assignment}
                    driverName={order.driverName}
                  />
                </td>

                {/* 8. Action Link */}
                <td className="py-3.5 px-4 align-top text-end">
                  <button
                    type="button"
                    onClick={() => onSelectOrder?.(order.id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50/50 hover:bg-brand-100/70 text-brand-700 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-blue min-h-[36px] cursor-pointer"
                    aria-label={t("towTruck.open", { number: order.number })}
                  >
                    <span>{t("towTruck.quickPreview")}</span>
                    <ArrowUpRight size={14} className="rtl:rotate-270 shrink-0" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
