/**
 * @file TowTruckWorkspaceHeader.tsx
 * @description Header for Full Order Workspace.
 * Displays order number, authentic creation timestamp, status pills,
 * back-to-queue navigation button with preserved queue state, and refresh action.
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, RefreshCw, Truck, XCircle } from "lucide-react";
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

export function TowTruckWorkspaceHeader({
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

  return (
    <header className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Top Bar: Back Button & Actions */}
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

      {/* Main Identity & Badges Row */}
      <div className="flex items-start justify-between gap-4 flex-wrap pt-1 border-t border-ink-100">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-brand-blue text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Truck size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-bold text-brand-blue tracking-tight">
                <bdi>{order.number}</bdi>
              </h1>
              <span className="text-xs text-ink-400 font-medium">
                {t("towTruck.identity")}: <bdi>#{order.id}</bdi>
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1 text-xs text-ink-500">
              <span>{t("towTruck.created")}:</span>
              {dateInfo.valid ? (
                <time
                  dateTime={dateInfo.iso ?? undefined}
                  title={dateInfo.absolute}
                  className="font-medium text-ink-700 cursor-default"
                >
                  <span className="text-ink-900 font-semibold">{dateInfo.absolute}</span>
                  {dateInfo.relative && (
                    <span className="text-ink-500 ms-1.5 font-normal">({dateInfo.relative})</span>
                  )}
                </time>
              ) : (
                <span className="italic text-ink-400">{t("towTruck.missing")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Pills */}
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
    </header>
  );
}
