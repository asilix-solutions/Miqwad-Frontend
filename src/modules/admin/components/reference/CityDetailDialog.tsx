/**
 * @file CityDetailDialog.tsx
 * @description Dialog showing single city details via GET /api/Cities/{id}.
 */

import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useCityDetailQuery } from "../../hooks/useRoadsQueries";

interface Props {
  cityId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const detailPinIcon = L.divIcon({
  className: "city-detail-map-pin",
  html: `<div style="transform: translate(-50%, -100%);">
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.163 24.837 0 16 0Z" fill="#F45E2B"/>
      <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

export function CityDetailDialog({ cityId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const {
    data: city,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCityDetailQuery(cityId);

  const copyPlaceId = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[var(--color-ink-body)] flex items-center gap-2">
            <MapPin className="size-5 text-[var(--color-brand-orange)]" />
            {t("superAdmin.cities.details.title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="size-7 animate-spin text-[var(--color-brand-orange)]" />
            <span className="text-xs text-[var(--color-muted)]">{t("common.loading")}</span>
          </div>
        ) : isError || !city ? (
          <div className="py-6 space-y-4">
            <div
              role="alert"
              className="rounded-[var(--radius-md)] bg-danger-50 border border-danger-200 p-3.5 text-xs text-danger-700 flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{t("superAdmin.cities.errors.detailFailed")}</span>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {t("common.retry")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Header entity view */}
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--color-divider)]">
              <div>
                <h3 className="text-base font-bold text-[var(--color-ink-body)]">
                  {city.name || `#${city.id}`}
                </h3>
                <span className="text-xs text-[var(--color-muted)]">#{city.id}</span>
              </div>
              <Badge
                variant="outline"
                className={
                  city.isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }
              >
                {city.isActive
                  ? t("superAdmin.cities.columns.active")
                  : t("superAdmin.cities.columns.inactive")}
              </Badge>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-[var(--radius-md)] border border-[var(--color-divider)] space-y-1">
                <span className="text-[var(--color-muted)] flex items-center gap-1">
                  <Globe className="size-3.5 text-[var(--color-muted)]" />
                  {t("superAdmin.cities.details.countryCode")}
                </span>
                <p className="font-mono font-semibold text-[var(--color-ink-body)]">
                  {city.countryCode || "—"}
                </p>
              </div>

              <div className="p-2.5 rounded-[var(--radius-md)] border border-[var(--color-divider)] space-y-1">
                <span className="text-[var(--color-muted)] flex items-center gap-1">
                  <Calendar className="size-3.5 text-[var(--color-muted)]" />
                  {t("superAdmin.cities.details.createdAt")}
                </span>
                <p className="font-medium text-[var(--color-ink-body)]">
                  {formatDate(city.createdAt)}
                </p>
              </div>
            </div>

            {/* Google Place ID */}
            {city.googlePlaceId && (
              <div className="p-2.5 rounded-[var(--radius-md)] border border-[var(--color-divider)] space-y-1.5">
                <span className="text-xs text-[var(--color-muted)]">
                  {t("superAdmin.cities.details.googlePlaceId")}
                </span>
                <div className="flex items-center justify-between gap-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="font-mono text-xs text-slate-800 break-all select-all">
                    {city.googlePlaceId}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => copyPlaceId(city.googlePlaceId!)}
                  >
                    {copied ? (
                      <Check className="size-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="size-3.5 text-slate-600" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Coordinates & Mini-Map */}
            {typeof city.latitude === "number" &&
            typeof city.longitude === "number" &&
            !isNaN(city.latitude) &&
            !isNaN(city.longitude) &&
            Math.abs(city.latitude) <= 90 &&
            Math.abs(city.longitude) <= 180 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted)]">
                    {t("superAdmin.cities.details.coordinates")}:{" "}
                    <span className="font-mono text-[var(--color-ink-body)] font-semibold" dir="ltr">
                      {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                    </span>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${city.latitude},${city.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--color-brand-orange)] hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="size-3" />
                    {t("superAdmin.cities.details.viewOnGoogleMaps")}
                  </a>
                </div>

                <div className="h-[180px] w-full rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-divider)]">
                  <MapContainer
                    center={[city.latitude, city.longitude]}
                    zoom={10}
                    scrollWheelZoom={false}
                    dragging={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[city.latitude, city.longitude]} icon={detailPinIcon} />
                  </MapContainer>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-[var(--radius-md)] border border-[var(--color-divider)] space-y-1">
                <span className="text-xs text-[var(--color-muted)]">
                  {t("superAdmin.cities.details.coordinates")}
                </span>
                <p className="font-mono text-xs text-[var(--color-ink-body)]">—</p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t("superAdmin.cities.details.close")}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
