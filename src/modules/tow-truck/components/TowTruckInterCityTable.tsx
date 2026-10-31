/**
 * @file TowTruckInterCityTable.tsx
 * @description Specialized desktop operations queue table for InterCity Tow Truck workspace.
 * Purpose-built for corridor-oriented transport scanning, highlighting:
 * 1. Order identity and timestamps
 * 2. Connected origin-to-destination city corridors (with directional RTL/LTR safety)
 * 3. Operational status & stage
 * 4. Driver assignment status
 * 5. Vehicle details & plate display
 * 6. Recorded order amount & independent payment status
 * 7. Customer & verified receiver details (when available)
 * 8. Quick Preview Drawer trigger
 *
 * No N+1 queries. No fabricated data. No direct assignment actions in queue.
 */
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
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

export function TowTruckInterCityTable({
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
            <th
              scope="col"
              className="py-3.5 px-4 text-start whitespace-nowrap min-w-[130px]"
            >
              {t("towTruck.colOrderTime")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap min-w-[220px]"
            >
              {t("towTruck.colCorridor")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap min-w-[120px]"
            >
              {t("towTruck.colOrderStatus")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap min-w-[140px]"
            >
              {t("towTruck.colDriver")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap min-w-[160px]"
            >
              {t("towTruck.colVehicle")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap min-w-[130px]"
            >
              {t("towTruck.colAmountPayment")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-3 text-start whitespace-nowrap hidden xl:table-cell min-w-[160px]"
            >
              {t("towTruck.colCustomer")}
            </th>
            <th
              scope="col"
              className="py-3.5 px-4 text-end whitespace-nowrap min-w-[90px]"
            >
              {t("towTruck.colAction")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
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
              <tr
                key={order.id}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a, button")) return;
                  onSelectOrder?.(order.id);
                }}
                className={`transition-colors cursor-pointer hover:bg-brand-50/40 ${
                  isSelected
                    ? "bg-brand-50/80 font-normal ring-1 ring-inset ring-brand-blue/30"
                    : "bg-white"
                }`}
                data-order-id={order.id}
              >
                {/* 1. Order Identity & Creation Date */}
                <td className="py-3.5 px-4 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-brand-blue tracking-tight">
                      <bdi>{order.number}</bdi>
                    </span>
                    {dateInfo.valid ? (
                      <time
                        dateTime={dateInfo.iso ?? undefined}
                        title={dateInfo.absolute}
                        className="text-[11px] text-ink-500 flex flex-col leading-tight cursor-default"
                      >
                        {dateInfo.relative && (
                          <span className="font-medium text-ink-700">
                            {dateInfo.relative}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-400">
                          {dateInfo.absolute}
                        </span>
                      </time>
                    ) : (
                      <span className="text-[11px] text-ink-400 italic">
                        {t("towTruck.missing")}
                      </span>
                    )}
                  </div>
                </td>

                {/* 2. InterCity Corridor (Connected Journey) */}
                <td className="py-3.5 px-3 align-top">
                  <div className="flex flex-col gap-1.5 max-w-[260px]">
                    {hasBothCities ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 border border-blue-200/90 text-blue-950 w-fit">
                        <Route
                          size={13}
                          className="text-blue-600 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-bold text-xs tracking-tight text-blue-950">
                          {originCity}
                        </span>
                        {/* Physical journey arrow: rtl:rotate-180 points to destination in both directions */}
                        <ArrowRight
                          size={12}
                          className="rtl:rotate-180 text-blue-500 shrink-0 mx-0.5"
                          aria-hidden="true"
                        />
                        <span className="font-bold text-xs tracking-tight text-blue-950">
                          {destinationCity}
                        </span>
                      </div>
                    ) : originCity || destinationCity ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-ink-50 border border-ink-200 text-ink-700 text-xs w-fit">
                        <AlertCircle
                          size={12}
                          className="text-ink-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-medium">
                          {originCity ?? t("towTruck.missing")}
                        </span>
                        <ArrowRight
                          size={11}
                          className="rtl:rotate-180 text-ink-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="font-medium">
                          {destinationCity ?? t("towTruck.missing")}
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-ink-50/80 border border-ink-200 text-ink-500 text-xs w-fit">
                        <AlertCircle
                          size={12}
                          className="text-ink-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[11px] italic">
                          {t("towTruck.intercityRouteDetailsMissing")}
                        </span>
                      </div>
                    )}

                    {order.intercityDetails.roadId && (
                      <span className="text-[10px] text-ink-400 font-mono flex items-center gap-1 px-0.5">
                        {t("towTruck.roadIdLabel", {
                          id: order.intercityDetails.roadId,
                        })}
                      </span>
                    )}
                  </div>
                </td>

                {/* 3. Operational Order Status & Stage */}
                <td className="py-3.5 px-3 align-top whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    <TowTruckOrderStatusBadge status={order.status} />
                    <TowTruckStageBadge stage={order.stage} />
                  </div>
                </td>

                {/* 4. Driver Assignment */}
                <td className="py-3.5 px-3 align-top">
                  <TowTruckAssignmentBadge
                    assignment={order.assignment}
                    driverName={order.driverName}
                  />
                </td>

                {/* 5. Vehicle & Plate */}
                <td className="py-3.5 px-3 align-top">
                  <div className="flex flex-col items-start gap-1 max-w-[160px]">
                    <span
                      className="font-medium text-ink-800 text-xs truncate"
                      title={vehicleName ?? undefined}
                    >
                      {vehicleName ?? t("towTruck.vehicleMissing")}
                    </span>
                    <TowTruckPlateDisplay plate={order.plate} />
                  </div>
                </td>

                {/* 6. Recorded Amount & Payment Status */}
                <td className="py-3.5 px-3 align-top whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    {order.total !== null ? (
                      <div className="flex items-baseline gap-1 font-bold text-ink-900 text-xs">
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
                      <span className="text-[11px] text-ink-400 italic">
                        {t("towTruck.missing")}
                      </span>
                    )}
                    <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
                  </div>
                </td>

                {/* 7. Customer & Receiver (Hidden on small laptops) */}
                <td className="py-3.5 px-3 align-top hidden xl:table-cell">
                  <div className="flex flex-col gap-1 max-w-[160px]">
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-ink-900 text-xs truncate"
                        title={order.customer ?? undefined}
                      >
                        {order.customer ?? t("towTruck.customerMissing")}
                      </span>
                      {order.phone ? (
                        <a
                          href={`tel:${order.phone}`}
                          className="inline-flex items-center gap-1 text-brand-blue hover:text-brand-700 text-[11px] font-medium transition-colors w-fit"
                          title={t("towTruck.contactCustomer")}
                        >
                          <Phone size={10} className="shrink-0" aria-hidden="true" />
                          <bdi>{order.phone}</bdi>
                        </a>
                      ) : (
                        <span className="text-[11px] text-ink-400 italic">
                          {t("towTruck.contactMissing")}
                        </span>
                      )}
                    </div>

                    {/* Receiver: only displayed when genuinely present in response payload */}
                    {receiverName && (
                      <div className="pt-1 mt-1 border-t border-ink-100 flex flex-col text-[11px]">
                        <span className="text-[10px] text-ink-400 font-medium">
                          {t("towTruck.receiver")}:
                        </span>
                        <span
                          className="font-medium text-ink-800 truncate"
                          title={receiverName}
                        >
                          {receiverName}
                        </span>
                        {receiverPhone && (
                          <a
                            href={`tel:${receiverPhone}`}
                            className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-900 text-[10px] transition-colors w-fit"
                          >
                            <Phone size={9} className="shrink-0" aria-hidden="true" />
                            <bdi>{receiverPhone}</bdi>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* 8. Action Link */}
                <td className="py-3.5 px-4 align-top text-end whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onSelectOrder?.(order.id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50/50 hover:bg-brand-100/70 text-brand-700 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-blue min-h-[36px] cursor-pointer"
                    aria-label={t("towTruck.open", { number: order.number })}
                  >
                    <span>{t("towTruck.quickPreview")}</span>
                    <ArrowUpRight
                      size={14}
                      className="rtl:rotate-270 shrink-0"
                      aria-hidden="true"
                    />
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
