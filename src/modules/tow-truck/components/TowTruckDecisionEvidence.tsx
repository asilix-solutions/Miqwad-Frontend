/**
 * Decision-grade evidence for the order review. No inferred corridor, payment,
 * contractual price or operation permission. Full read-only source sections
 * stay available in the record disclosure below the action region.
 */
import { useTranslation } from "react-i18next";
import { AlertTriangle, CreditCard, MapPin, Truck, UserRound } from "lucide-react";
import type { TowTruckOrder, TripLocation } from "../lib/towTruckModel";
import { TowTruckPaymentStatusBadge } from "./TowTruckStatusBadge";

interface Props {
  order: TowTruckOrder;
}

function RecordedPlace({
  label,
  point,
}: {
  label: string;
  point: TripLocation;
}) {
  const { t } = useTranslation();
  return (
    <div className="tow-p4r-evidence-item">
      <dt>{label}</dt>
      <dd>{point.title ?? point.description ?? t("towTruck.missing")}</dd>
      {point.title && point.description && point.description !== point.title && (
        <p className="tow-p4r-evidence-detail">{point.description}</p>
      )}
      {point.quality !== "unverified" && (
        <p className="tow-p4r-evidence-caution">
          <AlertTriangle size={13} aria-hidden="true" />
          {t(`towTruck.${{
            missing: "locationMissing",
            invalid: "locationInvalid",
            suspect: "locationSuspect",
            unverified: "locationUnverified",
          }[point.quality]}`)}
        </p>
      )}
    </div>
  );
}

function CorridorPoint({
  label,
  cityName,
  recordedLabel,
  point,
}: {
  label: string;
  cityName: string | null;
  recordedLabel: string;
  point: TripLocation;
}) {
  const { t } = useTranslation();
  const recordedAddress = point.title ?? point.description ?? t("towTruck.missing");
  return (
    <div className="tow-p4r-evidence-item">
      <dt>{label}</dt>
      <dd>{cityName ?? t("towTruck.cityMissing")}</dd>
      <p className="tow-p4r-evidence-detail">
        <span>{recordedLabel}:</span> {recordedAddress}
      </p>
      {point.title && point.description && point.title !== point.description && (
        <p className="tow-p4r-evidence-detail">{point.description}</p>
      )}
      {!cityName && (
        <p className="tow-p4r-evidence-caution">
          <AlertTriangle size={13} aria-hidden="true" />
          {t("towTruck.p4rCityNotVerified")}
        </p>
      )}
      {point.quality !== "unverified" && (
        <p className="tow-p4r-evidence-caution">
          <AlertTriangle size={13} aria-hidden="true" />
          {t(`towTruck.${{
            missing: "locationMissing",
            invalid: "locationInvalid",
            suspect: "locationSuspect",
            unverified: "locationUnverified",
          }[point.quality]}`)}
        </p>
      )}
    </div>
  );
}

export function TowTruckDecisionEvidence({ order }: Props) {
  const { t, i18n } = useTranslation();
  const intercity = order.serviceType === "intercity";
  const originCity = order.intercityDetails.originCityName;
  const destinationCity = order.intercityDetails.destinationCityName;
  const vehicle = i18n.language.toLowerCase().startsWith("ar")
    ? (order.vehicleAr ?? order.vehicle)
    : order.vehicle;
  const amount =
    order.total === null
      ? t("towTruck.missing")
      : `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(order.total)} ${t("towTruck.currencySar")}`;

  return (
    <section className="tow-p4r-evidence-card" aria-labelledby="tow-p4r-evidence-heading">
      <div className="tow-p4r-card-heading">
        <span className="tow-p4r-card-icon"><MapPin size={18} aria-hidden="true" /></span>
        <div>
          <h2 id="tow-p4r-evidence-heading">{t("towTruck.p4rDecisionEvidence")}</h2>
          <p>{t("towTruck.p4rEvidenceQualification")}</p>
        </div>
      </div>

      <dl className="tow-p4r-evidence-grid">
        {intercity ? (
          <>
            <CorridorPoint
              label={t("towTruck.departureCity")}
              cityName={originCity}
              recordedLabel={t("towTruck.f2OriginAddress")}
              point={order.origin}
            />
            <CorridorPoint
              label={t("towTruck.arrivalCity")}
              cityName={destinationCity}
              recordedLabel={t("towTruck.f2DestinationAddress")}
              point={order.destination}
            />
          </>
        ) : (
          <>
            <RecordedPlace label={t("towTruck.f1Pickup")} point={order.origin} />
            <RecordedPlace label={t("towTruck.f1Dropoff")} point={order.destination} />
          </>
        )}
      </dl>

      <div className="tow-p4r-evidence-meta">
        <div className="tow-p4r-meta-row">
          <Truck size={16} aria-hidden="true" />
          <span>{t("towTruck.vehicle")}</span>
          <strong>{vehicle ?? order.plate ?? t("towTruck.vehicleMissing")}</strong>
          {order.plate && <bdi className="tow-p4r-plate">{order.plate}</bdi>}
        </div>
        <div className="tow-p4r-meta-row">
          <UserRound size={16} aria-hidden="true" />
          <span>{intercity ? t("towTruck.senderParty") : t("towTruck.customer")}</span>
          <strong>{order.customer ?? t("towTruck.customerMissing")}</strong>
        </div>
        {intercity && (
          <div className="tow-p4r-meta-row">
            <UserRound size={16} aria-hidden="true" />
            <span>{t("towTruck.receiverParty")}</span>
            <strong>{order.intercityDetails.receiverName ?? t("towTruck.receiverUnavailable")}</strong>
          </div>
        )}
        <div className="tow-p4r-meta-row">
          <Truck size={16} aria-hidden="true" />
          <span>{t("towTruck.p4rCurrentDriver")}</span>
          <strong>
            {order.assignment === "assigned"
              ? (order.driverName ?? t("towTruck.assigned"))
              : order.assignment === "unassigned"
                ? t("towTruck.unassigned")
                : t("towTruck.unknown")}
          </strong>
        </div>
        <div className="tow-p4r-meta-row tow-p4r-meta-finance">
          <CreditCard size={16} aria-hidden="true" />
          <span>{t("towTruck.payment")}</span>
          <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
          <span className="tow-p4r-finance-total">
            {t("towTruck.r2RecordedTotal")}: <bdi>{amount}</bdi>
          </span>
        </div>
      </div>
      <p className="tow-p4r-evidence-footer">{t("towTruck.p4rNotAuthorization")}</p>
    </section>
  );
}
