import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowUpRight,
  Car,
  FileText,
  MapPin,
  Phone,
  Truck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nextActionMessage } from "../lib/dispatchModel";
import { TowTruckDriverOperations } from "./TowTruckDriverOperations";
import { useDriverOperations } from "../hooks/useDriverOperations";
import { TowTruckDispatch } from "./TowTruckDispatch";
import type { TowTruckOrder, TripLocation } from "../lib/towTruckModel";

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="tow-section">
      <h3 className="tow-section-title">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tow-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
function LocationBlock({
  point,
  destination = false,
}: {
  point: TripLocation;
  destination?: boolean;
}) {
  const { t } = useTranslation();
  const qualityKey = {
    missing: "locationMissing",
    invalid: "locationInvalid",
    suspect: "locationSuspect",
    unverified: "locationUnverified",
  }[point.quality];
  return (
    <div className="tow-stop">
      <span className={`tow-stop-dot ${destination ? "tow-stop-end" : ""}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="tow-label">{t(`towTruck.${destination ? "destination" : "origin"}`)}</p>
        <p className="tow-stop-title">{point.title ?? t("towTruck.missing")}</p>
        {point.description && <p className="tow-description">{point.description}</p>}
        <p className="tow-hint">{t(`towTruck.${qualityKey}`)}</p>
        {point.quality === "unverified" && (
          <p className="tow-coordinates">
            <bdi dir="ltr">
              {point.latitude}, {point.longitude}
            </bdi>
          </p>
        )}
      </div>
    </div>
  );
}

export function TowTruckDetail({
  order,
  onDirtyChange,
  onBusyChange,
  stale,
}: {
  order: TowTruckOrder;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  stale: boolean;
}) {
  const { t, i18n } = useTranslation();
  const operations = useDriverOperations(order.id);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentDirty, setAssignmentDirty] = useState(false);
  const [accountDirty, setAccountDirty] = useState(false);
  useEffect(() => {
    onBusyChange(assignmentBusy || operations.busy);
    return () => onBusyChange(false);
  }, [assignmentBusy, operations.busy, onBusyChange]);
  useEffect(() => {
    onDirtyChange(assignmentDirty || accountDirty);
    return () => onDirtyChange(false);
  }, [assignmentDirty, accountDirty, onDirtyChange]);
  const money = (value: number | null) =>
    value === null
      ? t("towTruck.missing")
      : new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 20 }).format(value);
  const date = order.createdAt
    ? new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(order.createdAt),
      )
    : t("towTruck.missing");
  const phone = order.phone?.replace(/[\s()-]/g, "");
  const callable = phone && /^\+?\d{5,15}$/.test(phone);
  return (
    <article className="tow-detail" aria-labelledby="tow-detail-title">
      <header className="tow-detail-header">
        <div className="tow-detail-identity">
          <div>
            <p className="tow-eyebrow">{t("towTruck.selected")}</p>
            <h2 id="tow-detail-title">
              <bdi>{order.number}</bdi>
            </h2>
          </div>
          <span className="tow-stage">
            <AlertCircle size={14} aria-hidden="true" />
            {t(`towTruck.${order.stage}`)}
          </span>
        </div>
        <p className="tow-hint">
          {t("towTruck.created")} · <time dateTime={order.createdAt ?? undefined}>{date}</time>
        </p>
        <dl className="tow-status-grid">
          <Field label={t("towTruck.orderStatus")}>
            <span>
              {order.status ? t(`orders.status.${order.status}`) : t("towTruck.statusUnknown")}
            </span>
            {!order.status && order.statusCode !== null && (
              <small>{t("towTruck.code", { code: order.statusCode })}</small>
            )}
          </Field>
          <Field label={t("towTruck.payment")}>
            <span>
              {t(order.paymentPending ? "towTruck.paymentPending" : "towTruck.paymentUnknown")}
            </span>
            {!order.paymentPending && order.paymentCode !== null && (
              <small>{t("towTruck.code", { code: order.paymentCode })}</small>
            )}
          </Field>
          <Field label={t("towTruck.assignment")}>
            <span>{t(`towTruck.${order.assignment}`)}</span>
          </Field>
        </dl>
        <p className="tow-hint">{t("towTruck.statusNote")}</p>
        <div className="tow-next-step">
          <strong>{t("towTruck.nextStep")}</strong>
          <p>
            {t(
              `towTruck.${operations.removalHistory ? "opsInitialHeld" : nextActionMessage(order)}`,
            )}
          </p>
          <Button
            variant="link"
            className="px-0"
            onClick={() => {
              const target = document.getElementById("tow-dispatch-title");
              target?.focus({ preventScroll: true });
              target?.scrollIntoView({ block: "start" });
            }}
          >
            {t("towTruck.dispatchTitle")}
          </Button>
        </div>
      </header>
      <div className="tow-detail-body">
        <Section title={t("towTruck.route")} icon={<MapPin size={18} aria-hidden="true" />}>
          <div className="tow-route">
            <LocationBlock point={order.origin} />
            <LocationBlock point={order.destination} destination />
          </div>
          <p className="tow-hint">{t("towTruck.originHint")}</p>
          {order.sameLocations && (
            <p className="tow-warning">
              <AlertCircle size={16} aria-hidden="true" />
              {t("towTruck.sameLocations")}
            </p>
          )}
        </Section>
        <div className="tow-info-grid">
          <Section title={t("towTruck.customer")} icon={<UserRound size={18} aria-hidden="true" />}>
            <p className="tow-value">{order.customer ?? t("towTruck.customerMissing")}</p>
            {order.customerId && (
              <p className="tow-hint">
                {t("towTruck.identity")} <bdi>#{order.customerId}</bdi>
              </p>
            )}
            <p className="tow-description">
              <bdi dir="ltr">{order.phone ?? t("towTruck.contactMissing")}</bdi>
            </p>
            {callable && (
              <a className="tow-contact" href={`tel:${phone}`}>
                <Phone size={15} aria-hidden="true" />
                {t("towTruck.call")}
              </a>
            )}
          </Section>
          <Section title={t("towTruck.vehicle")} icon={<Car size={18} aria-hidden="true" />}>
            <p className="tow-value">{order.vehicle ?? t("towTruck.vehicleMissing")}</p>
            <dl>
              <Field label={t("towTruck.plate")}>
                <bdi>{order.plate ?? t("towTruck.missing")}</bdi>
              </Field>
            </dl>
            {order.vehicleId && (
              <p className="tow-hint">
                {t("towTruck.identity")} <bdi>#{order.vehicleId}</bdi>
              </p>
            )}
          </Section>
        </div>
        <Section title={t("towTruck.driver")} icon={<Truck size={18} aria-hidden="true" />}>
          <div className="tow-driver-line">
            <div>
              <p className="tow-value">
                {order.assignment === "assigned"
                  ? (order.driverName ?? t("towTruck.driverMissing"))
                  : t(`towTruck.${order.assignment}`)}
              </p>
              {order.driverId && (
                <p className="tow-hint">
                  {t("towTruck.identity")} <bdi>#{order.driverId}</bdi>
                </p>
              )}
            </div>
            <span className="tow-hint">{t("towTruck.availability")}</span>
          </div>
          <p className="tow-hint">{t("towTruck.driverHint")}</p>
        </Section>
        <Section title={t("towTruck.finances")} icon={<FileText size={18} aria-hidden="true" />}>
          <dl className="tow-money">
            <Field label={t("towTruck.subtotal")}>{money(order.subtotal)}</Field>
            <Field label={t("towTruck.discount")}>{money(order.discount)}</Field>
            <Field label={t("towTruck.totalPrice")}>{money(order.total)}</Field>
          </dl>
          <p className="tow-hint">{t("towTruck.moneyHint")}</p>
          <div className="tow-payment-note">
            <strong>
              {t("towTruck.payment")} ·{" "}
              {t(order.paymentPending ? "towTruck.paymentPending" : "towTruck.paymentUnknown")}
            </strong>
            <p>
              {t(order.paymentPending ? "towTruck.pendingCustomerHint" : "towTruck.paymentHint")}
            </p>
          </div>
          <dl className="tow-info-grid">
            <Field label={t("towTruck.paymentMethod")}>
              {t("towTruck.methodUnknown")}
              {order.paymentMethodCode !== null && (
                <small>{t("towTruck.code", { code: order.paymentMethodCode })}</small>
              )}
            </Field>
            <Field label={t("towTruck.duration")}>
              {order.duration ?? t("towTruck.missing")}
              <small>{t("towTruck.durationHint")}</small>
            </Field>
          </dl>
        </Section>
        <details className="tow-notes">
          <summary>
            {t("towTruck.notes")} <span>{order.attachments.length || ""}</span>
          </summary>
          <p className="tow-description whitespace-pre-wrap">
            {order.notes ?? t("towTruck.noNotes")}
          </p>
          {order.attachments.length ? (
            <ul className="tow-attachments">
              {order.attachments.map((a, index) => (
                <li key={a.key}>
                  {a.url ? (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${a.name ?? t("towTruck.attachment", { number: index + 1 })} — ${t("towTruck.openAttachment")}`}
                    >
                      <FileText size={16} aria-hidden="true" />
                      <span>{a.name ?? t("towTruck.attachment", { number: index + 1 })}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <span>
                      {a.name ?? t("towTruck.attachment", { number: index + 1 })} ·{" "}
                      {t("towTruck.unavailableLink")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tow-hint">
              {t(order.attachmentsKnown ? "towTruck.noAttachments" : "towTruck.attachmentsUnknown")}
            </p>
          )}
        </details>
        <TowTruckDriverOperations
          order={order}
          stale={stale}
          operations={operations}
          onDirtyChange={setAccountDirty}
        />
        <TowTruckDispatch
          order={order}
          onDirtyChange={setAssignmentDirty}
          onBusyChange={setAssignmentBusy}
          operationsBlocked={operations.initialBlocked}
          stale={stale}
        />
      </div>
    </article>
  );
}
