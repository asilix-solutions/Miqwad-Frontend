/**
 * @file TowTruckInterCityFinanceSection.tsx
 * @description Dedicated Financial Record Section for InterCity Tow Truck Workspace.
 * Accurately displays recorded order amounts (subtotal, discount, total), payment status,
 * verified payment method, and separately displays current reference road tariff
 * without client-side recalculation or false claims of immutability.
 */
import { useTranslation } from "react-i18next";
import { Clock, CreditCard, DollarSign, Route } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { TowTruckPaymentStatusBadge } from "./TowTruckStatusBadge";
import { paymentMethodToI18nKey } from "@modules/orders/lib/orderEnums";
import { useRoadDetailQuery } from "@modules/admin/hooks/useRoadsQueries";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckInterCityFinanceSection({ order }: Props) {
  const { t, i18n } = useTranslation();

  const roadIdNum = order.intercityDetails.roadId ? Number(order.intercityDetails.roadId) : 0;
  const roadDetailQuery = useRoadDetailQuery(roadIdNum);
  const referenceTariff =
    roadDetailQuery.data && typeof roadDetailQuery.data.cost === "number"
      ? roadDetailQuery.data.cost
      : null;

  const formatAmount = (val: number | null | undefined) => {
    if (val === null || val === undefined) return t("towTruck.missing");
    return `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(val)} ${t("towTruck.currencySar")}`;
  };

  const paymentExplanation =
    order.paymentStatus === "Paid"
      ? t("towTruck.paymentPaidHint")
      : order.paymentStatus === "Failed"
        ? t("towTruck.paymentFailedHint")
        : order.paymentStatus === "Refunded"
          ? t("towTruck.paymentRefundedHint")
          : order.paymentPending
            ? t("towTruck.pendingCustomerHint")
            : t("towTruck.paymentHint");

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
          <DollarSign size={17} className="text-success-600" aria-hidden="true" />
          <span>{t("towTruck.intercityFinanceTitle")}</span>
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t("towTruck.intercityFinanceSubtitle")}
        </p>
      </div>

      {/* Recorded Financial Amounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 space-y-1">
          <span className="text-xs text-ink-500 font-medium block">
            {t("towTruck.recordedSubtotal")}
          </span>
          <span className="text-base font-bold text-ink-900 block">
            {formatAmount(order.subtotal)}
          </span>
        </div>

        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 space-y-1">
          <span className="text-xs text-ink-500 font-medium block">
            {t("towTruck.recordedDiscount")}
          </span>
          <span className="text-base font-bold text-ink-900 block">
            {formatAmount(order.discount)}
          </span>
        </div>

        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5 space-y-1 shadow-2xs">
          <span className="text-xs text-brand-blue font-semibold block">
            {t("towTruck.recordedTotal")}
          </span>
          <span className="text-lg font-bold text-brand-blue block">
            {formatAmount(order.total)}
          </span>
        </div>
      </div>

      {/* Reference Road Tariff (Presented Separately) */}
      {referenceTariff !== null && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-1.5 text-xs text-blue-900">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold flex items-center gap-1.5 text-brand-blue">
              <Route size={14} className="text-brand-blue" aria-hidden="true" />
              <span>{t("towTruck.referenceTariffCardTitle")}</span>
            </span>
            <span className="font-bold text-brand-blue bg-white px-2.5 py-0.5 rounded border border-blue-200">
              {formatAmount(referenceTariff)}
            </span>
          </div>
          <p className="text-[11px] text-ink-500 leading-relaxed">
            {t("towTruck.referenceTariffNotice")}
          </p>
        </div>
      )}

      {/* Payment Status & Details */}
      <div className="rounded-xl border border-ink-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-ink-500" aria-hidden="true" />
            <span className="text-xs font-bold text-ink-900">
              {t("towTruck.payment")}
            </span>
          </div>
          <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
        </div>

        <p className="text-xs text-ink-600 leading-relaxed bg-ink-50 p-3 rounded-lg border border-ink-100">
          {paymentExplanation}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-ink-100">
          <div className="space-y-1">
            <span className="text-[11px] text-ink-500 block">
              {t("towTruck.paymentMethod")}
            </span>
            <span className="text-xs font-semibold text-ink-800">
              {order.paymentMethod
                ? t(paymentMethodToI18nKey(order.paymentMethod))
                : t("towTruck.methodUnknown")}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-ink-500 block flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              <span>{t("towTruck.duration")}</span>
            </span>
            <span className="text-xs font-semibold text-ink-800">
              {order.duration ?? t("towTruck.missing")}
            </span>
            <small className="block text-[10px] text-ink-400">
              {t("towTruck.durationHint")}
            </small>
          </div>
        </div>
      </div>

      {/* Integrity Disclaimer */}
      <p className="text-[11px] text-ink-400 leading-relaxed">
        {t("towTruck.financialRecordNotice")}
      </p>
    </section>
  );
}
