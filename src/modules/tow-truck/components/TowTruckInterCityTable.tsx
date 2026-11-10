/** Phase 3C desktop queue: identity, journey, direction, separate preview. */
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Car,
  Eye,
  LockKeyhole,
  CircleAlert,
  ClipboardCheck,
  Minus,
} from "lucide-react";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";
import { TowTruckServiceIdentity } from "./TowTruckServiceIdentity";
import type { TowTruckQueueProps } from "./TowTruckTable";

export function TowTruckInterCityTable({
  orders,
  directions,
  fromQueue,
  selectedOrderId,
  onSelectOrder,
  interactionDisabled = false,
  className = "",
}: TowTruckQueueProps) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);
  return (
    <div className={`tow-q-desktop ${className}`}>
      <table className="tow-q-table">
        <caption className="sr-only">{t("towTruck.queue")}</caption>
        <colgroup>
          <col className="tow-q-col-id" />
          <col className="tow-q-col-route" />
          <col className="tow-q-col-direction" />
          <col className="tow-q-col-preview" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{t("towTruck.qIdentityHeading")}</th>
            <th scope="col">{t("towTruck.qJourneyHeading")}</th>
            <th scope="col">{t("towTruck.qDirectionHeading")}</th>
            <th scope="col">
              <span className="sr-only">{t("towTruck.quickPreview")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const origin = order.isInterCity
              ? order.intercityDetails.originCityName
              : (order.origin.title ?? order.origin.description);
            const destination = order.isInterCity
              ? order.intercityDetails.destinationCityName
              : (order.destination.title ?? order.destination.description);
            const vehicle = (isAr ? order.vehicleAr : order.vehicle) ?? order.vehicle;
            const direction = directions[order.id] ?? {
              title: t("towTruck.qVerifyOrder"),
              reason: t("towTruck.qReadOnlyAdvice"),
              tone: "warning",
            };
            const DirectionIcon =
              direction.tone === "blocked"
                ? LockKeyhole
                : direction.tone === "warning"
                  ? CircleAlert
                  : direction.tone === "muted"
                    ? Minus
                    : ClipboardCheck;

            return (
              <tr
                key={order.id}
                data-order-id={order.id}
                data-selected={selectedOrderId === order.id}
              >
                <td className="tow-q-id">
                  <TowTruckServiceIdentity
                    order={order}
                    fromQueue={fromQueue}
                    disabled={interactionDisabled}
                  />
                </td>
                <td className="tow-q-route">
                  <div className="tow-q-journey">
                    <span>
                      <span className="sr-only">{t("towTruck.originShort")}: </span>
                      {origin || t("towTruck.qPickupMissing")}
                    </span>
                    <ArrowRight className="rtl:rotate-180" size={16} aria-hidden="true" />
                    <span>
                      <span className="sr-only">{t("towTruck.destination")}: </span>
                      {destination || t("towTruck.qDeliveryMissing")}
                    </span>
                  </div>
                  <div className="tow-q-car">
                    <Car size={15} aria-hidden="true" />
                    <bdi>{vehicle || t("towTruck.vehicleMissing")}</bdi>
                    {order.plate && <bdi className="tow-q-plate">{order.plate}</bdi>}
                  </div>
                </td>
                <td className="tow-q-direction">
                  <div className={`tow-q-action tow-q-action--${direction.tone}`}>
                    <DirectionIcon size={18} aria-hidden="true" />
                    <span>{direction.title}</span>
                  </div>
                  <p className="tow-q-reason">{direction.reason}</p>
                </td>
                <td className="tow-q-preview-cell">
                  <button
                    type="button"
                    className="tow-q-preview"
                    data-order-id={order.id}
                    data-queue-control="preview"
                    aria-haspopup="dialog"
                    disabled={interactionDisabled}
                    onClick={() => onSelectOrder?.(order.id)}
                    aria-label={t("towTruck.qOpenPreview", { number: order.number })}
                    title={t("towTruck.quickPreview")}
                  >
                    <Eye size={20} aria-hidden="true" />
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
