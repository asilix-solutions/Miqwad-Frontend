/**
 * @file TowTruckInterCityPartiesSection.tsx
 * @description Dedicated Logistics Parties Section for InterCity Tow Truck Workspace.
 * Accurately and distinctly separates the Sending Party (Requesting Customer)
 * from the Receiving Party (Delivery Point Contact), with accessible phone links
 * and verified address details.
 */
import { useTranslation } from "react-i18next";
import { Info, MapPin, Phone, User, UserCheck } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckInterCityPartiesSection({ order }: Props) {
  const { t } = useTranslation();

  const cleanPhone = (val: string | null | undefined) => val?.replace(/[\s()-]/g, "");
  const isCallable = (val: string | null | undefined) => {
    const c = cleanPhone(val);
    return Boolean(c && /^\+?\d{5,15}$/.test(c));
  };

  const customerPhone = order.phone;
  const customerCallable = isCallable(customerPhone);

  const receiverName = order.intercityDetails.receiverName;
  const receiverPhone = order.intercityDetails.receiverPhone;
  const receiverCallable = isCallable(receiverPhone);
  const hasReceiverData = Boolean(receiverName || receiverPhone);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
          <UserCheck size={17} className="text-brand-blue" aria-hidden="true" />
          <span>{t("towTruck.logisticsPartiesTitle")}</span>
        </h3>
        <p className="text-xs text-ink-500 mt-0.5">
          {t("towTruck.logisticsPartiesSubtitle")}
        </p>
      </div>

      {/* Two Parties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* 1. Sending Party (Requesting Customer) */}
        <div className="rounded-xl border border-brand-200/80 bg-brand-50/20 p-4.5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-wider pb-2 border-b border-brand-100">
              <User size={15} className="text-brand-blue" aria-hidden="true" />
              <span>{t("towTruck.senderParty")}</span>
            </div>

            {/* Customer Identity */}
            <div className="space-y-1">
              <span className="text-[11px] text-ink-500 font-medium block">
                {t("towTruck.name")}
              </span>
              <p className="font-bold text-ink-900 text-sm">
                {order.customer ?? t("towTruck.customerMissing")}
              </p>
              {order.customerId && (
                <p className="text-[11px] text-ink-500">
                  {t("towTruck.partyIdentity")}: <bdi>#{order.customerId}</bdi>
                </p>
              )}
            </div>

            {/* Pickup Address */}
            <div className="space-y-1 pt-1 border-t border-brand-100/60">
              <span className="text-[11px] text-ink-500 font-medium block flex items-center gap-1">
                <MapPin size={12} className="text-brand-blue" aria-hidden="true" />
                <span>{t("towTruck.senderPickupAddress")}</span>
              </span>
              <p className="text-xs text-ink-800 font-medium">
                {order.origin.title ?? t("towTruck.missing")}
              </p>
              {order.origin.description && (
                <p className="text-[11px] text-ink-500 leading-relaxed">
                  {order.origin.description}
                </p>
              )}
            </div>
          </div>

          {/* Contact Action */}
          <div className="pt-2.5 border-t border-brand-100/80 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-500">{t("towTruck.senderContact")}</span>
            {customerCallable ? (
              <a
                href={`tel:${cleanPhone(customerPhone)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 text-brand-blue text-xs font-semibold shadow-2xs transition-colors"
                title={t("towTruck.call")}
              >
                <Phone size={13} aria-hidden="true" />
                <bdi dir="ltr">{customerPhone}</bdi>
              </a>
            ) : customerPhone ? (
              <span className="text-xs font-mono text-ink-800">
                <bdi dir="ltr">{customerPhone}</bdi>
              </span>
            ) : (
              <span className="text-xs text-ink-400 italic">
                {t("towTruck.contactMissing")}
              </span>
            )}
          </div>
        </div>

        {/* 2. Receiving Party (Delivery Point) */}
        <div className="rounded-xl border border-orange-200/80 bg-orange-50/20 p-4.5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-brand-orange font-bold text-xs uppercase tracking-wider pb-2 border-b border-orange-100">
              <UserCheck size={15} className="text-brand-orange" aria-hidden="true" />
              <span>{t("towTruck.receiverParty")}</span>
            </div>

            {hasReceiverData ? (
              <>
                {/* Receiver Name */}
                <div className="space-y-1">
                  <span className="text-[11px] text-ink-500 font-medium block">
                    {t("towTruck.name")}
                  </span>
                  <p className="font-bold text-ink-900 text-sm">
                    {receiverName ?? t("towTruck.receiverUnavailable")}
                  </p>
                </div>

                {/* Delivery Address */}
                <div className="space-y-1 pt-1 border-t border-orange-100/60">
                  <span className="text-[11px] text-ink-500 font-medium block flex items-center gap-1">
                    <MapPin size={12} className="text-brand-orange" aria-hidden="true" />
                    <span>{t("towTruck.receiverDeliveryAddress")}</span>
                  </span>
                  <p className="text-xs text-ink-800 font-medium">
                    {order.destination.title ?? t("towTruck.missing")}
                  </p>
                  {order.destination.description && (
                    <p className="text-[11px] text-ink-500 leading-relaxed">
                      {order.destination.description}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-lg border border-dashed border-ink-200 bg-white/70 text-center space-y-1 my-auto">
                <p className="text-xs font-semibold text-ink-700">
                  {t("towTruck.receiverUnavailable")}
                </p>
                <p className="text-[11px] text-ink-400">
                  {t("towTruck.receiverNotCustomerNote")}
                </p>
              </div>
            )}
          </div>

          {/* Contact Action */}
          <div className="pt-2.5 border-t border-orange-100/80 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-500">{t("towTruck.receiverContact")}</span>
            {receiverCallable ? (
              <a
                href={`tel:${cleanPhone(receiverPhone)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-white hover:bg-orange-50 text-brand-orange text-xs font-semibold shadow-2xs transition-colors"
                title={t("towTruck.call")}
              >
                <Phone size={13} aria-hidden="true" />
                <bdi dir="ltr">{receiverPhone}</bdi>
              </a>
            ) : receiverPhone ? (
              <span className="text-xs font-mono text-ink-800">
                <bdi dir="ltr">{receiverPhone}</bdi>
              </span>
            ) : (
              <span className="text-xs text-ink-400 italic">
                {t("towTruck.receiverUnavailable")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Distinction Reminder Callout */}
      <div className="p-3 rounded-lg border border-ink-200 bg-ink-50/50 flex items-start gap-2 text-xs text-ink-600">
        <Info size={15} className="text-ink-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed">
          {t("towTruck.receiverNotCustomerNote")}
        </p>
      </div>
    </section>
  );
}
