/**
 * @file TowTruckFinanceSection.tsx
 * @description Financial Information section for Tow Truck Workspace.
 * Accurately displays subtotal, discount, total, payment status, payment method,
 * and recorded estimated duration without inventing currencies or financial promises.
 */
import { useTranslation } from "react-i18next";
import { Clock, CreditCard, DollarSign, ShieldCheck } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { TowTruckPaymentStatusBadge } from "./TowTruckStatusBadge";
import { paymentMethodToI18nKey } from "@modules/orders/lib/orderEnums";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckFinanceSection({ order }: Props) {
  const { t, i18n } = useTranslation();

  const formatAmount = (val: number | null) => {
    if (val === null) return t("towTruck.missing");
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
      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
        <DollarSign size={16} className="text-success-600" aria-hidden="true" />
        <span>{t("towTruck.orderFinances")}</span>
      </h3>

      {/* Financial Amounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 space-y-1">
          <span className="text-xs text-ink-500 font-medium block">
            {t("towTruck.subtotal")}
          </span>
          <span className="text-base font-bold text-ink-900 block">
            {formatAmount(order.subtotal)}
          </span>
        </div>

        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 space-y-1">
          <span className="text-xs text-ink-500 font-medium block">
            {t("towTruck.discount")}
          </span>
          <span className="text-base font-bold text-ink-900 block">
            {formatAmount(order.discount)}
          </span>
        </div>

        <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3.5 space-y-1">
          <span className="text-xs text-brand-blue font-semibold block">
            {t("towTruck.totalPrice")}
          </span>
          <span className="text-lg font-bold text-brand-blue block">
            {formatAmount(order.total)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-ink-400 italic">
        {t("towTruck.moneyHint")}
      </p>

      {/* InterCity Predefined Fixed Route Price Notice */}
      {order.isInterCity && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3.5 space-y-1 text-xs text-brand-900">
          <div className="font-semibold flex items-center gap-1.5 text-brand-800">
            <ShieldCheck size={14} className="text-brand-orange" aria-hidden="true" />
            <span>{t("towTruck.intercityFixedPriceNoticeTitle")}</span>
          </div>
          <p className="text-[11px] text-ink-600 leading-relaxed">
            {t("towTruck.intercityFixedPriceNoticeDesc")}
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
    </section>
  );
}
