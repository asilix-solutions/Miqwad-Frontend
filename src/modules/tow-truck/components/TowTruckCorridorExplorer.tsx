/**
 * @file TowTruckCorridorExplorer.tsx
 * @description Corridor Exploration Layer for InterCity Tow Truck Workspace (Phase 2C.2).
 * Enables operations staff to browse, search, and focus on configured highway transport corridors.
 *
 * Core Architecture & Compliance Rules:
 * 1. Uses verified Roads query layer (useAvailableRoadsQuery).
 * 2. Implemented as accessible filter/exploration chips with role="group" and aria-pressed.
 *    Strictly NOT application navigation tabs (zero role="tablist" / role="tab").
 * 3. Directional route distinction: A -> B and B -> A are independent directional corridors.
 * 4. Zero fabricated order counts: Server-side order totals per road do not exist in GET /api/Orders;
 *    no misleading page-local counts are derived or presented.
 * 5. Price separation invariant: Road.cost is strictly labelled as reference tariff, never implying
 *    that existing order amounts are overwritten or recalculated.
 * 6. Responsive mobile behavior: Horizontally scrollable corridor track without vertical crowding.
 */

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Network,
  RefreshCw,
  Route,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAvailableRoadsQuery,
  useCitiesListQuery,
} from "@modules/admin/hooks/useRoadsQueries";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";
import { cn } from "@shared/lib/utils";

export interface TowTruckCorridorExplorerProps {
  selectedCorridorId: number | null;
  onSelectCorridor: (id: number | null) => void;
  onOpenNetworkView: () => void;
  className?: string;
}

export function TowTruckCorridorExplorer({
  selectedCorridorId,
  onSelectCorridor,
  onOpenNetworkView,
  className = "",
}: TowTruckCorridorExplorerProps) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const [searchQuery, setSearchQuery] = useState("");

  const roadsQuery = useAvailableRoadsQuery();
  const citiesQuery = useCitiesListQuery();

  const cityMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const city of citiesQuery.data ?? []) {
      if (city.id && city.name) {
        map.set(city.id, city.name);
      }
    }
    return map;
  }, [citiesQuery.data]);

  const rawRoads = useMemo(() => roadsQuery.data ?? [], [roadsQuery.data]);

  // Enrich road items with resolved city names if snapshot was missing
  const corridors = useMemo(() => {
    return rawRoads.map((road) => ({
      ...road,
      resolvedOrigin:
        road.originCityName ?? cityMap.get(road.originCityId) ?? t("towTruck.unspecifiedCity"),
      resolvedDestination:
        road.destinationCityName ??
        cityMap.get(road.destinationCityId) ??
        t("towTruck.unspecifiedCity"),
    }));
  }, [rawRoads, cityMap, t]);

  // Client-side search filtering within the verified configured corridors list
  const filteredCorridors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return corridors;

    return corridors.filter((c) => {
      const origin = c.resolvedOrigin.toLowerCase();
      const dest = c.resolvedDestination.toLowerCase();
      return origin.includes(query) || dest.includes(query);
    });
  }, [corridors, searchQuery]);

  const selectedCorridor = useMemo(() => {
    if (selectedCorridorId === null) return null;
    return corridors.find((c) => c.id === selectedCorridorId) ?? null;
  }, [corridors, selectedCorridorId]);

  const currencySymbol = t("common.currency.sar") || (isAr ? "ر.س" : "SAR");

  return (
    <section
      aria-labelledby="tow-corridor-explorer-heading"
      className={cn(
        "rounded-2xl border border-ink-200/90 bg-white p-3.5 sm:p-4 shadow-2xs mb-4 select-none",
        className,
      )}
    >
      {/* Corridor Explorer Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-ink-100">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Route
              size={18}
              className="text-[var(--color-brand-orange)] shrink-0"
              aria-hidden="true"
            />
            <h2
              id="tow-corridor-explorer-heading"
              className="text-sm sm:text-base font-bold text-[var(--color-brand-blue)]"
            >
              {t("towTruck.corridorsExplorerTitle")}
            </h2>
            <span className="text-[11px] font-semibold text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full">
              {corridors.length}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">
            {t("towTruck.corridorsExplorerSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Geographic Corridor / Network View Entry Point (Phase 2C.2 Section 6) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenNetworkView}
            className="h-8 text-xs font-semibold text-[var(--color-brand-blue)] border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 gap-1.5"
            aria-label={t("towTruck.viewNetworkAriaLabel")}
          >
            <Network size={14} className="text-blue-600 shrink-0" aria-hidden="true" />
            <span>{t("towTruck.viewNetwork")}</span>
          </Button>

          {/* Quick Refresh */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void roadsQuery.refetch()}
            disabled={roadsQuery.isFetching}
            className="h-8 w-8 p-0 text-ink-500 hover:text-ink-900"
            aria-label={t("towTruck.refresh")}
          >
            <RefreshCw
              size={14}
              className={roadsQuery.isFetching ? "animate-spin" : ""}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {/* Corridors Filter / Search Bar (when more than 4 corridors exist) */}
      {corridors.length > 4 && (
        <div className="relative mt-2.5 max-w-xs">
          <Search
            size={13}
            className="absolute top-1/2 -translate-y-1/2 start-2.5 text-ink-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("towTruck.searchCorridorsPlaceholder")}
            aria-label={t("towTruck.searchCorridorsAriaLabel")}
            className="w-full text-xs h-8 ps-8 pe-7 rounded-lg border border-ink-200 bg-ink-50/50 text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 end-2 text-ink-400 hover:text-ink-700 p-0.5"
              aria-label={t("towTruck.clearCorridorSearch")}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Corridor Chips Track */}
      <div className="mt-3">
        {roadsQuery.isPending ? (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-8 w-32 rounded-lg bg-ink-100 animate-pulse shrink-0"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : roadsQuery.isError ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            <span>{t("towTruck.corridorsLoadError")}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void roadsQuery.refetch()}
              className="h-6 px-2 text-xs"
            >
              {t("towTruck.retry")}
            </Button>
          </div>
        ) : corridors.length === 0 ? (
          <div className="text-xs text-ink-500 py-3 text-center bg-ink-50/60 rounded-xl border border-dashed border-ink-200">
            {t("towTruck.noAvailableCorridors")}
          </div>
        ) : (
          <div
            role="group"
            aria-label={t("towTruck.corridorsAriaLabel")}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1.5 pt-0.5 -mx-1 px-1 touch-pan-x"
          >
            {/* Default: All Corridors */}
            <button
              type="button"
              onClick={() => onSelectCorridor(null)}
              aria-pressed={selectedCorridorId === null}
              title={t("towTruck.corridorAllDesc")}
              className={cn(
                "group relative shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 min-h-[36px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1",
                selectedCorridorId === null
                  ? "bg-[var(--color-brand-blue)] text-white shadow-xs"
                  : "bg-ink-50/90 text-ink-700 hover:bg-ink-100/90 border border-ink-200/70",
              )}
            >
              <Route size={13} className="shrink-0" aria-hidden="true" />
              <span>{t("towTruck.corridorAll")}</span>
            </button>

            {/* Configured Directional Corridors */}
            {filteredCorridors.map((road) => {
              const isSelected = selectedCorridorId === road.id;
              const formattedCost = road.cost.toLocaleString();

              return (
                <button
                  key={road.id}
                  type="button"
                  onClick={() => onSelectCorridor(isSelected ? null : road.id)}
                  aria-pressed={isSelected}
                  aria-label={t("towTruck.corridorChipAriaLabel", {
                    origin: road.resolvedOrigin,
                    destination: road.resolvedDestination,
                    cost: formattedCost,
                  })}
                  className={cn(
                    "group relative shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 min-h-[36px]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1",
                    isSelected
                      ? "bg-[var(--color-brand-blue)] text-white shadow-xs font-bold"
                      : "bg-ink-50/90 text-ink-800 hover:bg-ink-100/90 border border-ink-200/70 font-medium",
                  )}
                >
                  <span className="flex items-center gap-1">
                    <span>{road.resolvedOrigin}</span>
                    <ArrowRight
                      size={11}
                      className={cn(
                        "shrink-0 transition-transform",
                        isAr ? "rotate-180" : "",
                        isSelected ? "text-blue-200" : "text-ink-400 group-hover:text-ink-600",
                      )}
                      aria-hidden="true"
                    />
                    <span>{road.resolvedDestination}</span>
                  </span>

                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-semibold select-none",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-white text-ink-600 border border-ink-200/60",
                    )}
                  >
                    {formattedCost} {currencySymbol}
                  </span>
                </button>
              );
            })}

            {filteredCorridors.length === 0 && searchQuery && (
              <span className="text-xs text-ink-500 py-1 px-2 italic shrink-0">
                {t("towTruck.noCorridorsFound")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Selected Corridor Context Summary Card (Phase 2C.2 Section 5) */}
      {selectedCorridor && (
        <div
          className="mt-3.5 p-3 sm:p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          role="region"
          aria-label={t("towTruck.selectedCorridorTitle")}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ink-900 inline-flex items-center gap-1.5 text-sm">
                <MapPin size={13} className="text-amber-600 shrink-0" aria-hidden="true" />
                <span>{selectedCorridor.resolvedOrigin}</span>
                <ArrowRight
                  size={12}
                  className={cn("text-ink-500 shrink-0", isAr ? "rotate-180" : "")}
                  aria-hidden="true"
                />
                <MapPin size={13} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{selectedCorridor.resolvedDestination}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={11} aria-hidden="true" />
                <span>{t("towTruck.routeStatusActive")}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100/70 text-blue-900 border border-blue-200">
                <span>{t("towTruck.corridorInspectionBadge")}</span>
              </span>

              <span className="text-[10px] text-ink-500 bg-white px-1.5 py-0.5 rounded border border-ink-200/80">
                {t("towTruck.corridorReferenceId")}: #{selectedCorridor.id}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-ink-600 leading-relaxed">
                {t("towTruck.referenceTariffNote")}
              </p>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                {t("towTruck.corridorInspectionNotice")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-100">
            <div className="text-end">
              <span className="text-[10px] font-medium text-ink-500 block">
                {t("towTruck.referenceTariff")}
              </span>
              <span className="text-sm font-bold text-[var(--color-brand-blue)]">
                {selectedCorridor.cost.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-ink-600">{currencySymbol}</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                to="/admin/reference?tab=routes"
                className="h-8 px-2.5 inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white text-xs font-semibold text-ink-700 hover:text-ink-950 hover:bg-ink-50 transition-colors"
                title={t("towTruck.manageCorridorInReference")}
              >
                <ExternalLink size={12} aria-hidden="true" />
                <span className="hidden sm:inline">{t("towTruck.manageCorridorInReference")}</span>
              </Link>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onSelectCorridor(null)}
                className="h-8 px-2 text-xs text-ink-600 hover:text-ink-900"
                aria-label={t("towTruck.clearCorridorSelection")}
              >
                <X size={14} className="me-1" aria-hidden="true" />
                <span>{t("towTruck.clearCorridorSelection")}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
