/** Shared request identity for the four queue renderers; no operational authority. */
import { Link, useNavigate } from "react-router-dom";
import { handleOrderLinkClick, safeQueueUrl } from "../lib/queueContinuity";
import { useTranslation } from "react-i18next";
import { MapPin, Route, CircleHelp } from "lucide-react";
import { orderStatusToI18nKey } from "@modules/orders/lib/orderEnums";
import type { TowTruckOrder } from "../lib/towTruckModel";

interface Props {
  order: TowTruckOrder;
  fromQueue: string;
  disabled?: boolean;
}
export function TowTruckServiceIdentity({ order, fromQueue, disabled }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const service = order.dispatchService;
  const Icon = service === "intracity" ? MapPin : service === "intercity" ? Route : CircleHelp;
  const label =
    service === "intracity"
      ? "navIntraCityBadge"
      : service === "intercity"
        ? "navInterCityBadge"
        : "qUnknownService";
  return (
    <div className="tow-q-identity">
      <span className={`tow-q-tile tow-q-tile--${service}`}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <div>
        {disabled ? (
          <span className="tow-q-number">
            <bdi>{order.number}</bdi>
          </span>
        ) : (
          <Link
            className="tow-q-number"
            to={`/admin/tow-truck/${order.id}`}
            state={{ fromQueue: safeQueueUrl(fromQueue) ?? "/admin/tow-truck" }}
            data-order-id={order.id}
            data-queue-control="details"
            onClick={(event) =>
              handleOrderLinkClick(event, navigate, fromQueue, order.id, "details")
            }
            aria-label={t("towTruck.qOpenDetails", { number: order.number })}
          >
            <bdi>{order.number}</bdi>
          </Link>
        )}
        <span className="tow-q-minor">{t(`towTruck.${label}`)}</span>
        <span className="tow-q-state">
          {t("towTruck.qOrderState", {
            state: order.status
              ? t(orderStatusToI18nKey(order.status))
              : t("towTruck.statusUnknown"),
          })}
        </span>
      </div>
    </div>
  );
}
