/**
 * @file TowTruckInterCityCorridorSection.tsx
 * @description Dedicated Transport Corridor Section for InterCity Tow Truck Workspace.
 * Accurately presents long-distance corridor details, origin & destination points,
 * configured road identity, current reference road tariff (with explicit distinction from order total),
 * external navigation links, and entry point to the route-network overview.
 */
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Compass,
  ExternalLink,
  Network,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TowTruckOrder, TripLocation } from "../lib/towTruckModel";
import { useRoadDetailQuery } from "@modules/admin/hooks/useRoadsQueries";

interface Props {
  order: TowTruckOrder;
  onOpenNetworkModal?: () => void;
}

function LocationPointCard({
  point,
  cityName,
  isDestination = false,
}: {
  point: TripLocation;
  cityName?: string | null;
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
    point.longitude !== null &&
    !(point.latitude === 0 && point.longitude === 0);

  const mapsUrl = hasValidCoords
    ? `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`
    : null;

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4.5 space-y-3 shadow-2xs flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {isDestination ? (
            <span
              className="w-3 h-3 rounded-[3px] bg-brand-orange ring-4 ring-orange-100 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <span
              className="w-3 h-3 rounded-full bg-brand-blue ring-4 ring-brand-100 shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="text-xs font-bold text-ink-900 uppercase tracking-wider">
            {t(`towTruck.${isDestination ? "destinationPoint" : "originPoint"}`)}
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

      {/* City Badge */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-ink-500">
          {t(`towTruck.${isDestination ? "arrivalCity" : "departureCity"}`)}:
        </span>
        <span className="text-xs font-bold text-ink-900 bg-ink-50 px-2 py-0.5 rounded border border-ink-200">
          {cityName ?? t("towTruck.cityMissing")}
        </span>
      </div>

      {/* Address Details */}
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

      {/* Quality & Coordinates Footer */}
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

export function TowTruckInterCityCorridorSection({ order, onOpenNetworkModal }: Props) {
  const { t, i18n } = useTranslation();

  const roadIdNum = order.intercityDetails.roadId ? Number(order.intercityDetails.roadId) : 0;
  const roadDetailQuery = useRoadDetailQuery(roadIdNum);
  const roadData = roadDetailQuery.data;

  const origin = order.origin;
  const destination = order.destination;

  const bothHaveValidCoords =
    origin.quality === "unverified" &&
    origin.latitude !== null &&
    origin.longitude !== null &&
    !(origin.latitude === 0 && origin.longitude === 0) &&
    destination.quality === "unverified" &&
    destination.latitude !== null &&
    destination.longitude !== null &&
    !(destination.latitude === 0 && destination.longitude === 0);

  const directionsUrl = bothHaveValidCoords
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}`
    : null;

  const formatAmount = (val: number | null | undefined) => {
    if (val === null || val === undefined) return t("towTruck.missing");
    return `${new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(val)} ${t("towTruck.currencySar")}`;
  };

  const referenceTariff = roadData && typeof roadData.cost === "number" ? roadData.cost : null;
  const recordedTotal = order.total;

  const hasComparison = referenceTariff !== null && recordedTotal !== null;
  const comparisonMatches = hasComparison && Math.abs(referenceTariff - recordedTotal) < 0.01;

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-5">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
            <Route size={17} className="text-brand-orange" aria-hidden="true" />
            <span>{t("towTruck.corridorSectionTitle")}</span>
          </h3>
          <p className="text-xs text-ink-500 mt-0.5">
            {t("towTruck.corridorSectionSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 ms-auto flex-wrap">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-blue text-xs font-semibold transition-colors"
            >
              <Compass size={13} aria-hidden="true" />
              <span>{t("towTruck.directJourneyRoute")}</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}

          {onOpenNetworkModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNetworkModal}
              className="gap-1.5 text-xs border-ink-300 text-ink-700 hover:text-ink-950 font-medium"
            >
              <Network size={14} className="text-brand-blue" aria-hidden="true" />
              <span>{t("towTruck.openNetworkOverview")}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Configured Road & Reference Tariff Card */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
              {t("towTruck.routeCorridor")}:
            </span>
            {order.intercityDetails.roadId ? (
              <span className="text-xs font-mono font-bold text-brand-blue bg-white px-2.5 py-0.5 rounded border border-brand-200">
                #{order.intercityDetails.roadId}
              </span>
            ) : (
              <span className="text-xs text-ink-500 italic">
                {t("towTruck.noRoadConfigured")}
              </span>
            )}
          </div>

          {roadDetailQuery.isPending && (
            <span className="text-xs text-ink-500 animate-pulse">
              {t("towTruck.referenceTariffLoading")}
            </span>
          )}

          {referenceTariff !== null && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-500 font-medium">
                {t("towTruck.referenceRoadTariff")}:
              </span>
              <span className="text-sm font-bold text-brand-blue bg-white px-3 py-0.5 rounded-lg border border-brand-200 shadow-2xs">
                {formatAmount(referenceTariff)}
              </span>
            </div>
          )}
        </div>

        {/* Verified Comparison between Reference Tariff and Recorded Total */}
        {hasComparison && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 ${
              comparisonMatches
                ? "border-success-200 bg-success-50 text-success-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            {comparisonMatches ? (
              <ShieldCheck size={16} className="text-success-600 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
            )}
            <p className="font-medium leading-relaxed">
              {comparisonMatches
                ? t("towTruck.referenceTariffComparisonMatch", { cost: referenceTariff })
                : t("towTruck.referenceTariffComparisonDiff", {
                    recorded: recordedTotal,
                    reference: referenceTariff,
                  })}
            </p>
          </div>
        )}

        {/* Clarifying Disclaimer */}
        <p className="text-[11px] text-ink-500 leading-relaxed border-t border-brand-100 pt-2.5">
          {t("towTruck.referenceTariffNotice")}
        </p>
      </div>

      {/* Warnings: Identical or Suspicious Points */}
      {order.sameLocations && (
        <div className="p-3.5 rounded-xl border border-warning-300 bg-warning-50 text-warning-800 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-warning-600" aria-hidden="true" />
          <div className="space-y-0.5">
            <strong className="font-bold">{t("towTruck.sameLocations")}</strong>
            <p className="text-warning-700">{t("towTruck.originHint")}</p>
          </div>
        </div>
      )}

      {/* Origin & Destination Detailed Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationPointCard
          point={origin}
          cityName={order.intercityDetails.originCityName}
        />
        <LocationPointCard
          point={destination}
          cityName={order.intercityDetails.destinationCityName}
          isDestination
        />
      </div>
    </section>
  );
}
