/**
 * @file TowTruckCustomerVehicleSection.tsx
 * @description Customer & Vehicle cards for Tow Truck Workspace.
 * Accurately presents customer contact info, vehicle identity, license plate,
 * and handles missing catalog data with resilient fallbacks.
 */
import { useTranslation } from "react-i18next";
import { Car, Phone, User, UserCheck } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { TowTruckPlateDisplay } from "./TowTruckPlateDisplay";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckCustomerVehicleSection({ order }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const vehicleName =
    (isAr ? order.vehicleAr : order.vehicle) ??
    order.vehicle ??
    t("towTruck.vehicleMissing");

  const phone = order.phone?.replace(/[\s()-]/g, "");
  const callable = phone && /^\+?\d{5,15}$/.test(phone);

  const receiverPhone = order.intercityDetails?.receiverPhone?.replace(/[\s()-]/g, "");
  const receiverCallable = receiverPhone && /^\+?\d{5,15}$/.test(receiverPhone);

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
        <User size={16} className="text-brand-blue" aria-hidden="true" />
        <span>{t("towTruck.customerAndVehicle")}</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Card */}
        <div className="rounded-xl border border-ink-200 bg-ink-50/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-ink-600 font-bold text-xs uppercase tracking-wider">
            <User size={14} className="text-ink-500" aria-hidden="true" />
            <span>{t("towTruck.customer")}</span>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-ink-900 text-sm">
              {order.customer ?? t("towTruck.customerMissing")}
            </p>
            {order.customerId && (
              <p className="text-[11px] text-ink-500">
                {t("towTruck.identity")}: <bdi>#{order.customerId}</bdi>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-500">{t("towTruck.contact")}</span>
            {callable ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 text-brand-blue text-xs font-semibold shadow-2xs transition-colors"
                title={t("towTruck.call")}
              >
                <Phone size={13} aria-hidden="true" />
                <bdi dir="ltr">{order.phone}</bdi>
              </a>
            ) : order.phone ? (
              <span className="text-xs font-mono text-ink-800">
                <bdi dir="ltr">{order.phone}</bdi>
              </span>
            ) : (
              <span className="text-xs text-ink-400 italic">
                {t("towTruck.contactMissing")}
              </span>
            )}
          </div>
        </div>

        {/* Vehicle Card */}
        <div className="rounded-xl border border-ink-200 bg-ink-50/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-ink-600 font-bold text-xs uppercase tracking-wider">
            <Car size={14} className="text-ink-500" aria-hidden="true" />
            <span>{t("towTruck.vehicle")}</span>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-ink-900 text-sm">{vehicleName}</p>
            {order.vehicleId && (
              <p className="text-[11px] text-ink-500">
                {t("towTruck.identity")}: <bdi>#{order.vehicleId}</bdi>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-500">{t("towTruck.plate")}</span>
            <TowTruckPlateDisplay plate={order.plate} />
          </div>
        </div>

        {/* Receiver Card (InterCity) */}
        {order.isInterCity && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/20 p-4 space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-wider">
              <UserCheck size={14} className="text-brand-orange" aria-hidden="true" />
              <span>{t("towTruck.receiver")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-ink-500 font-medium block">{t("towTruck.name")}</span>
                <p className="font-bold text-ink-900 text-sm">
                  {order.intercityDetails?.receiverName ?? t("towTruck.receiverMissing")}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-ink-500 font-medium block">{t("towTruck.phone")}</span>
                {receiverCallable ? (
                  <a
                    href={`tel:${receiverPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-white hover:bg-brand-50 text-brand-blue text-xs font-semibold shadow-2xs transition-colors"
                    title={t("towTruck.call")}
                  >
                    <Phone size={13} aria-hidden="true" />
                    <bdi dir="ltr">{order.intercityDetails?.receiverPhone}</bdi>
                  </a>
                ) : order.intercityDetails?.receiverPhone ? (
                  <span className="text-xs font-mono text-ink-800">
                    <bdi dir="ltr">{order.intercityDetails?.receiverPhone}</bdi>
                  </span>
                ) : (
                  <span className="text-xs text-ink-400 italic">
                    {t("towTruck.contactMissing")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
