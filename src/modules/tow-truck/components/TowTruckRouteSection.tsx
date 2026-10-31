/**
 * @file TowTruckRouteSection.tsx
 * @description Route details section for Tow Truck Workspace.
 * Accurately presents origin, destination, coordinates, quality flags,
 * external map links, and alerts for suspicious/identical locations.
 */
import { useTranslation } from "react-i18next";
import { AlertTriangle, ExternalLink, MapPin, Route, UserCheck } from "lucide-react";
import type { TripLocation } from "../lib/towTruckModel";

interface Props {
  origin: TripLocation;
  destination: TripLocation;
  sameLocations: boolean;
  isInterCity?: boolean;
  routeSummary?: string | null;
  intercityDetails?: {
    roadId?: string | null;
    originCityName?: string | null;
    destinationCityName?: string | null;
    receiverName?: string | null;
    receiverPhone?: string | null;
  } | null;
}

function LocationCard({
  point,
  isDestination = false,
}: {
  point: TripLocation;
  isDestination?: boolean;
}) {
  const { t } = useTranslation();

  const qualityKey = {
    missing: "locationMissing",
    invalid: "locationInvalid",
    suspect: "locationSuspect",
    unverified: "locationUnverified",
  }[point.quality];

  const hasValidCoords =
    point.quality === "unverified" &&
    point.latitude !== null &&
    point.longitude !== null;

  const mapsUrl = hasValidCoords
    ? `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`
    : null;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4.5 space-y-3 shadow-2xs flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {isDestination ? (
            <span className="w-3 h-3 rounded-[3px] bg-brand-orange ring-4 ring-brand-100 shrink-0" aria-hidden="true" />
          ) : (
            <span className="w-3 h-3 rounded-full bg-info-500 ring-4 ring-info-100 shrink-0" aria-hidden="true" />
          )}
          <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
            {t(`towTruck.${isDestination ? "destination" : "origin"}`)}
          </span>
        </div>

        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:text-brand-700 transition-colors"
            title={t("towTruck.viewLocationOnMap")}
          >
            <span>{t("towTruck.viewLocationOnMap")}</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>

      <div className="space-y-1">
        <p className="font-bold text-ink-900 text-sm">
          {point.title ?? t("towTruck.missing")}
        </p>
        {point.description && (
          <p className="text-xs text-ink-600 leading-relaxed">
            {point.description}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-ink-100 flex items-center justify-between gap-2 text-xs flex-wrap">
        <span className="text-[11px] text-ink-500">
          {t("towTruck.locationQuality")}:{" "}
          <strong className="text-ink-700 font-medium">
            {t(`towTruck.${qualityKey}`)}
          </strong>
        </span>

        {hasValidCoords && (
          <span className="text-[11px] font-mono text-ink-500 bg-ink-50 px-2 py-0.5 rounded border border-ink-200">
            <bdi dir="ltr">
              {point.latitude}, {point.longitude}
            </bdi>
          </span>
        )}
      </div>
    </div>
  );
}

export function TowTruckRouteSection({
  origin,
  destination,
  sameLocations,
  isInterCity = false,
  routeSummary,
  intercityDetails,
}: Props) {
  const { t } = useTranslation();

  const bothHaveCoords =
    origin.quality === "unverified" &&
    origin.latitude !== null &&
    origin.longitude !== null &&
    destination.quality === "unverified" &&
    destination.latitude !== null &&
    destination.longitude !== null;

  const directionsUrl = bothHaveCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
    : null;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={16} className="text-brand-orange" aria-hidden="true" />
          <span>{t("towTruck.routeDetails")}</span>
        </h3>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-blue text-xs font-semibold transition-colors"
          >
            <span>{t("towTruck.viewOnGoogleMaps")}</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      {/* InterCity Predefined Route Banner */}
      {isInterCity && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Route size={14} className="text-amber-700" />
              <span>{t("towTruck.intercityPredefinedRoute")}</span>
            </span>
            {routeSummary ? (
              <span className="text-xs font-bold text-amber-900 bg-white px-2.5 py-0.5 rounded border border-amber-200">
                {routeSummary}
              </span>
            ) : (
              <span className="text-xs text-amber-800 italic bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200/50">
                {t("towTruck.intercityRouteDetailsMissing")}
              </span>
            )}
          </div>

          {/* Receiver Information when available */}
          {(intercityDetails?.receiverName || intercityDetails?.receiverPhone) && (
            <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                <UserCheck size={14} className="text-amber-700" />
                <span>{t("towTruck.receiver")}:</span>
                <strong className="text-ink-900">{intercityDetails.receiverName || t("towTruck.missing")}</strong>
              </div>
              {intercityDetails.receiverPhone && (
                <div className="text-amber-800 font-mono text-[11px]">
                  <span>{t("towTruck.receiverPhone")}: </span>
                  <bdi dir="ltr">{intercityDetails.receiverPhone}</bdi>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {sameLocations && (
        <div className="p-3.5 rounded-xl border border-warning-300 bg-warning-50 text-warning-800 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-warning-600" aria-hidden="true" />
          <div className="space-y-0.5">
            <strong className="font-bold">{t("towTruck.sameLocations")}</strong>
            <p className="text-warning-700">{t("towTruck.originHint")}</p>
          </div>
        </div>
      )}

      {/* Origin & Destination Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationCard point={origin} />
        <LocationCard point={destination} isDestination />
      </div>
    </section>
  );
}
