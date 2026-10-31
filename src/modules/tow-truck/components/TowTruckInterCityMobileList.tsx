/**
 * @file TowTruckInterCityMobileList.tsx
 * @description Specialized mobile operations queue cards for InterCity Tow Truck workspace.
 * Genuinely adapted for mobile highway transport coordination:
 * - Order identity and time with prominent touch target (>= 44px)
 * - Distinctive connected city corridor block (Origin → Destination)
 * - Vehicle information with license plate badge
 * - Clear separation of recorded amount and payment status
 * - Driver assignment and operational status badges
 * - Verified receiver display (when genuinely available)
 * - No horizontal overflow at 320px, full RTL/LTR safety
 */
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Car,
  Phone,
  Route,
} from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { formatTowTruckOrderDate } from "../lib/towTruckDate";
import {
  TowTruckOrderStatusBadge,
  TowTruckPaymentStatusBadge,
  TowTruckAssignmentBadge,
  TowTruckStageBadge,
} from "./TowTruckStatusBadge";
import { TowTruckPlateDisplay } from "./TowTruckPlateDisplay";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  orders: TowTruckOrder[];
  selectedOrderId?: string;
  onSelectOrder?: (id: string) => void;
  className?: string;
}

export function TowTruckInterCityMobileList({
  orders,
  selectedOrderId,
  onSelectOrder,
  className = "",
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  return (
    <ul
      className={`space-y-3 list-none p-0 m-0 ${className}`}
      aria-label={t("towTruck.queue")}
    >
      {orders.map((order) => {
        const isSelected = selectedOrderId === order.id;
        const dateInfo = formatTowTruckOrderDate(order.createdAt, i18n.language);
        const vehicleName = (isAr ? order.vehicleAr : order.vehicle) ?? order.vehicle;
        const originCity = order.intercityDetails.originCityName;
        const destinationCity = order.intercityDetails.destinationCityName;
        const hasBothCities = Boolean(originCity && destinationCity);
        const receiverName = order.intercityDetails.receiverName;
        const receiverPhone = order.intercityDetails.receiverPhone;

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
              data-order-id={order.id}
            >
              {/* Header: Order Number, Time & Primary Touch Action (>= 44px) */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-ink-100">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-bold text-base text-brand-blue tracking-tight">
                    <bdi>{order.number}</bdi>
                  </span>
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

              {/* Corridor Block: Prominent Highway Journey */}
              <div className="py-2.5 border-b border-ink-100">
                {hasBothCities ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-950 font-bold text-xs flex-wrap">
                    <Route
                      size={14}
                      className="text-blue-600 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{originCity}</span>
                    <ArrowRight
                      size={13}
                      className="rtl:rotate-180 text-blue-500 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{destinationCity}</span>
                    {order.intercityDetails.roadId && (
                      <span className="ms-auto text-[10px] text-blue-700/70 font-mono font-normal">
                        #{order.intercityDetails.roadId}
                      </span>
                    )}
                  </div>
                ) : originCity || destinationCity ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-50 border border-ink-200 text-ink-700 text-xs flex-wrap">
                    <AlertCircle
                      size={13}
                      className="text-ink-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{originCity ?? t("towTruck.missing")}</span>
                    <ArrowRight
                      size={12}
                      className="rtl:rotate-180 text-ink-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{destinationCity ?? t("towTruck.missing")}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-50/80 border border-ink-200 text-ink-500 text-xs">
                    <AlertCircle
                      size={13}
                      className="text-ink-400 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] italic">
                      {t("towTruck.intercityRouteDetailsMissing")}
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle & Recorded Amount Row */}
              <div className="py-2.5 flex items-center justify-between gap-2 border-b border-ink-100 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 text-ink-800 min-w-0">
                  <Car size={14} className="shrink-0 text-ink-400" aria-hidden="true" />
                  <span
                    className="truncate max-w-[130px] font-medium"
                    title={vehicleName ?? undefined}
                  >
                    {vehicleName ?? t("towTruck.vehicleMissing")}
                  </span>
                  <TowTruckPlateDisplay plate={order.plate} />
                </div>

                {order.total !== null ? (
                  <div className="flex items-baseline gap-1 font-bold text-ink-900 text-xs shrink-0">
                    <bdi>
                      {order.total.toLocaleString(isAr ? "ar-SA" : "en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </bdi>
                    <span className="text-[10px] font-normal text-ink-500">
                      {t("towTruck.currencySar")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-ink-400 italic shrink-0">
                    {t("towTruck.missing")}
                  </span>
                )}
              </div>

              {/* Status Badges & Assignment Row */}
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

              {/* Customer & Receiver Contacts (Progressive Disclosure) */}
              {(order.phone || receiverName) && (
                <div className="mt-2.5 pt-2 border-t border-ink-100/70 flex items-center justify-between gap-2 flex-wrap text-xs">
                  {order.phone && (
                    <a
                      href={`tel:${order.phone}`}
                      className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-700 text-xs font-medium py-1 px-2 rounded bg-ink-50 min-h-[36px]"
                      title={t("towTruck.contactCustomer")}
                    >
                      <Phone size={12} className="shrink-0" aria-hidden="true" />
                      <span className="text-[11px] text-ink-500 font-normal">
                        {t("towTruck.customer")}:
                      </span>
                      <bdi>{order.phone}</bdi>
                    </a>
                  )}

                  {receiverName && (
                    <div className="inline-flex items-center gap-1 py-1 px-2 rounded bg-ink-50 text-[11px] text-ink-700 min-h-[36px]">
                      <span className="text-ink-400 font-normal">
                        {t("towTruck.receiver")}:
                      </span>
                      <span className="font-medium truncate max-w-[100px]">
                        {receiverName}
                      </span>
                      {receiverPhone && (
                        <a
                          href={`tel:${receiverPhone}`}
                          className="ms-1 text-brand-blue hover:text-brand-700"
                        >
                          <Phone size={11} className="shrink-0" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
