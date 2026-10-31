/**
 * @file TowTruckNetworkModal.tsx
 * @description On-demand InterCity Transport Network modal dialog (Phase 2C.2).
 * Displays a schematic network diagram of configured city corridors and reference tariffs.
 *
 * Compliance & Licensing Invariants (Phase 2C.2 Section 6):
 * 1. Visualized strictly as schematic connections between cities, NOT actual road geometry.
 * 2. Zero fabrication of highway polylines, GPS tracks, physical distances, ETAs, or live tracking.
 * 3. Transparently documents coordinate provenance: City coordinates originate from Google Places,
 *    and under Google Maps Platform ToS (clause 3.2.4(a)), displaying them on third-party Leaflet/OSM
 *    tile layers is a licensing violation. Full GIS mapping is deferred pending compliant licensing.
 */

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Info,
  MapPin,
  Network,
  Route,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RoadResponseDto } from "@modules/admin/api/roadsApi";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";
import { cn } from "@shared/lib/utils";

export interface TowTruckNetworkModalProps {
  open: boolean;
  onClose: () => void;
  roads: RoadResponseDto[];
  selectedCorridorId?: number | null;
  onSelectCorridor?: (id: number | null) => void;
}

export function TowTruckNetworkModal({
  open,
  onClose,
  roads,
  selectedCorridorId,
  onSelectCorridor,
}: TowTruckNetworkModalProps) {
  const { t, i18n } = useTranslation();
  const isAr = isArabicLanguage(i18n.language);

  const activeRoads = roads.filter((r) => r.isActive);
  const originCityIds = new Set(activeRoads.map((r) => r.originCityId));
  const destinationCityIds = new Set(activeRoads.map((r) => r.destinationCityId));

  const handleSelect = (roadId: number) => {
    onSelectCorridor?.(roadId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        size="lg"
        className="max-h-[88vh] overflow-y-auto sm:max-w-2xl p-0 gap-0 border-ink-200"
      >
        {/* Modal Header */}
        <DialogHeader className="p-5 border-b border-ink-100 bg-ink-50/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-[var(--color-brand-blue)] text-white flex items-center justify-center shrink-0 shadow-2xs"
              aria-hidden="true"
            >
              <Network size={20} />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[var(--color-brand-blue)]">
                {t("towTruck.networkModalTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-500 mt-0.5">
                {t("towTruck.networkModalDesc")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* Network Metrics Overview */}
          <div className="grid grid-cols-3 gap-2 text-center select-none">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <span className="block text-lg sm:text-xl font-bold text-[var(--color-brand-blue)]">
                {activeRoads.length}
              </span>
              <span className="text-[11px] text-blue-900 font-medium">
                {t("towTruck.networkActiveCorridorsCount", { count: activeRoads.length })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <span className="block text-lg sm:text-xl font-bold text-amber-900">
                {originCityIds.size}
              </span>
              <span className="text-[11px] text-amber-800 font-medium">
                {t("towTruck.networkOriginCitiesCount", { count: originCityIds.size })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="block text-lg sm:text-xl font-bold text-emerald-900">
                {destinationCityIds.size}
              </span>
              <span className="text-[11px] text-emerald-800 font-medium">
                {t("towTruck.networkDestinationCitiesCount", { count: destinationCityIds.size })}
              </span>
            </div>
          </div>

          {/* Schematic Connection Principle Notice */}
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs text-blue-950"
            role="note"
          >
            <Info size={16} className="shrink-0 text-blue-600 mt-0.5" aria-hidden="true" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-[12px] text-[var(--color-brand-blue)]">
                {t("towTruck.networkSchematicNoticeTitle")}
              </span>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                {t("towTruck.networkSchematicNotice")}
              </p>
            </div>
          </div>

          {/* Schematic Corridor Connections List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
              <Route size={14} className="text-[var(--color-brand-orange)]" aria-hidden="true" />
              <span>{t("towTruck.corridorsExplorerTitle")}</span>
            </h3>

            {activeRoads.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-ink-200 text-center text-xs text-ink-500">
                {t("towTruck.noAvailableCorridors")}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activeRoads.map((road) => {
                  const isSelected = selectedCorridorId === road.id;
                  const originName = road.originCityName ?? t("towTruck.unspecifiedCity");
                  const destinationName = road.destinationCityName ?? t("towTruck.unspecifiedCity");

                  return (
                    <div
                      key={road.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border transition-colors",
                        isSelected
                          ? "border-[var(--color-brand-blue)] bg-blue-50/50 shadow-2xs"
                          : "border-ink-200 bg-white hover:border-ink-300",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-900">
                          <MapPin size={12} className="text-amber-600 shrink-0" aria-hidden="true" />
                          <span>{originName}</span>
                        </span>
                        <div
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-ink-100 text-ink-600 shrink-0"
                          title={t("towTruck.corridorDirectionalNotice")}
                        >
                          <ArrowRight
                            size={11}
                            className={cn(
                              "text-ink-500 shrink-0",
                              isAr && "rotate-180",
                            )}
                            aria-hidden="true"
                          />
                          <span>{isAr ? "مسار اتجاهي" : "Directional"}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-ink-900">
                          <MapPin size={12} className="text-emerald-600 shrink-0" aria-hidden="true" />
                          <span>{destinationName}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <div className="text-end">
                          <span className="text-[10px] text-ink-500 block">
                            {t("towTruck.referenceTariff")}
                          </span>
                          <span className="text-xs font-bold text-[var(--color-brand-blue)]">
                            {road.cost.toLocaleString()}{" "}
                            <span className="text-[10px] font-medium text-ink-600">
                              {t("common.currency.sar") || (isAr ? "ر.س" : "SAR")}
                            </span>
                          </span>
                        </div>

                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-7 text-xs px-2.5",
                            isSelected && "bg-[var(--color-brand-blue)] text-white hover:bg-[var(--color-brand-blue)]/90",
                          )}
                          onClick={() => handleSelect(road.id)}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={12} aria-hidden="true" />
                              <span>{isAr ? "قيد المعاينة" : "Inspecting"}</span>
                            </>
                          ) : (
                            <span>{t("towTruck.networkSelectCorridorAction")}</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-ink-100 bg-ink-50/40 flex flex-row items-center justify-between sm:justify-between">
          <Link
            to="/admin/reference?tab=routes"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-brand-blue)] hover:underline font-semibold"
            onClick={onClose}
          >
            <ExternalLink size={13} aria-hidden="true" />
            <span>{t("towTruck.manageCorridorInReference")}</span>
          </Link>
          <DialogClose asChild>
            <Button variant="outline" size="sm" onClick={onClose}>
              {t("towTruck.closeNetworkModal")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
