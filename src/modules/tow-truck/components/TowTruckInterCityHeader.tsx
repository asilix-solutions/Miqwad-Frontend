/**
 * @file TowTruckInterCityHeader.tsx
 * @description Purpose-built Journey Header for InterCity Full Order Workspace.
 * Emphasizes the long-distance vehicle transport journey, corridor origin/destination cities,
 * order identity, creation time, status badges, and operational action triggers.
 */
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Route,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { formatTowTruckOrderDate, formatTowTruckSyncTime } from "../lib/towTruckDate";
import {
  TowTruckOrderStatusBadge,
  TowTruckPaymentStatusBadge,
  TowTruckAssignmentBadge,
  TowTruckServiceTypeBadge,
} from "./TowTruckStatusBadge";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  order: TowTruckOrder;
  onBack: () => void;
  onRefresh: () => void;
  onCancelOrder?: () => void;
  isCancelling?: boolean;
  isFetching?: boolean;
  dataUpdatedAt?: number;
}

export function TowTruckInterCityHeader({
  order,
  onBack,
  onRefresh,
  onCancelOrder,
  isCancelling = false,
  isFetching = false,
  dataUpdatedAt,
}: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const dateInfo = formatTowTruckOrderDate(order.createdAt, i18n.language);
  const syncTime = formatTowTruckSyncTime(dataUpdatedAt ?? 0, i18n.language);

  const isAlreadyCancelled = order.statusCode === 5 || order.status === "Canceled";
  const isPaid = order.paymentCode === 2 || order.paymentStatus === "Paid";

  const originCity = order.intercityDetails.originCityName;
  const destinationCity = order.intercityDetails.destinationCityName;
  const hasRouteCities = Boolean(originCity || destinationCity);

  return (
    <header className="rounded-2xl border border-brand-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Top Bar: Navigation, Sync Status & Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs font-semibold text-ink-700 hover:text-ink-950 border-ink-300 min-h-[38px]"
        >
          {isAr ? (
            <ArrowRight size={15} className="rtl:rotate-0" aria-hidden="true" />
          ) : (
            <ArrowLeft size={15} aria-hidden="true" />
          )}
          <span>{t("towTruck.backToQueue")}</span>
        </Button>

        <div className="flex items-center gap-3 ms-auto flex-wrap">
          {syncTime && (
            <span className="text-[11px] text-ink-500 hidden sm:inline" role="status">
              {isFetching ? t("towTruck.refreshing") : t("towTruck.updated", { time: syncTime })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching || isCancelling}
            className="gap-1.5 text-xs min-h-[38px] border-ink-200 text-ink-700 hover:text-ink-900"
          >
            <RefreshCw
              size={14}
              className={`text-ink-500 ${isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{t("towTruck.refresh")}</span>
          </Button>

          {/* Cancellation action — withheld if already cancelled, disabled with explanation if Paid */}
          {!isAlreadyCancelled && onCancelOrder && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelOrder}
              disabled={isPaid || isCancelling || isFetching}
              title={isPaid ? t("towTruck.cancelBlockedPaid") : undefined}
              className="gap-1.5 text-xs min-h-[38px] border-danger-200 text-danger-600 hover:bg-danger-50 hover:text-danger-700 hover:border-danger-300 disabled:opacity-50 disabled:pointer-events-auto font-medium"
            >
              <XCircle size={14} className="text-danger-500" aria-hidden="true" />
              <span>{t("towTruck.cancelOrder")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Prominent Transport Journey Banner */}
      <div className="rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50/90 via-white to-blue-50/60 p-4 lg:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3.5 border-b border-brand-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue text-white shadow-xs">
              <Route size={16} aria-hidden="true" />
            </span>
            <div>
              <span className="text-[10px] font-bold text-brand-blue uppercase tracking-wider block">
                {t("towTruck.interCityWorkspaceEyebrow")}
              </span>
              <h2 className="text-sm font-bold text-ink-900">
                {t("towTruck.transportJourney")}
              </h2>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap ms-auto">
            <TowTruckServiceTypeBadge serviceType={order.serviceType} />
            <TowTruckOrderStatusBadge status={order.status} />
            <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
            <TowTruckAssignmentBadge
              assignment={order.assignment}
              driverName={order.driverName}
            />
          </div>
        </div>

        {/* Corridor Journey Display */}
        <div className="pt-4 flex items-center justify-between gap-6 flex-wrap">
          {hasRouteCities ? (
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              {/* Origin City */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-brand-200/90 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-blue ring-4 ring-brand-100 shrink-0" aria-hidden="true" />
                <div>
                  <span className="text-[10px] font-semibold text-ink-400 block leading-tight">
                    {t("towTruck.departureCity")}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-ink-900">
                    {originCity ?? t("towTruck.cityMissing")}
                  </span>
                </div>
              </div>

              {/* Directional Connector */}
              <div className="flex items-center gap-1.5 text-brand-orange px-1">
                <div className="h-0.5 w-6 sm:w-10 bg-brand-orange/40 rounded-full" />
                {isAr ? (
                  <ArrowLeft size={18} className="shrink-0" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} className="shrink-0" aria-hidden="true" />
                )}
                <div className="h-0.5 w-6 sm:w-10 bg-brand-orange/40 rounded-full" />
              </div>

              {/* Destination City */}
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-brand-200/90 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-brand-orange ring-4 ring-orange-100 shrink-0" aria-hidden="true" />
                <div>
                  <span className="text-[10px] font-semibold text-ink-400 block leading-tight">
                    {t("towTruck.arrivalCity")}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-ink-900">
                    {destinationCity ?? t("towTruck.cityMissing")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs italic">
              {t("towTruck.intercityRouteDetailsMissing")}
            </div>
          )}

          {/* Order Identity & Timestamp */}
          <div className="space-y-1 ms-auto text-end">
            <div className="flex items-baseline gap-2 justify-end">
              <h1 className="text-xl lg:text-2xl font-bold text-brand-blue tracking-tight">
                <bdi>{order.number}</bdi>
              </h1>
              <span className="text-xs text-ink-400 font-medium">
                {t("towTruck.identity")}: <bdi>#{order.id}</bdi>
              </span>
            </div>
            <div className="text-xs text-ink-500">
              <span>{t("towTruck.created")}: </span>
              {dateInfo.valid ? (
                <time
                  dateTime={dateInfo.iso ?? undefined}
                  title={dateInfo.absolute}
                  className="font-medium text-ink-700 cursor-default"
                >
                  <span className="text-ink-900 font-semibold">{dateInfo.absolute}</span>
                  {dateInfo.relative && (
                    <span className="text-ink-500 ms-1 font-normal">({dateInfo.relative})</span>
                  )}
                </time>
              ) : (
                <span className="italic text-ink-400">{t("towTruck.missing")}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
