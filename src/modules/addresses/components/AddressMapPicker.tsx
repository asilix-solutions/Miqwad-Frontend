/**
 * @file AddressMapPicker.tsx
 * @description Click-to-place / drag-to-adjust Leaflet coordinate picker for
 * the address form. Reuses the MapContainer/TileLayer + inline divIcon setup
 * from src/modules/discovery/components/ProviderMapView.tsx (Leaflet's
 * default marker asset paths break under Vite). Coordinate fields sit beside
 * the map on wide screens; a "use current location" button is a cheap
 * nicety on top of geolocation, no new dependency.
 */
import { useCallback, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25c0-8.284-6.716-15-15-15z" fill="#F45E2B"/>
    <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
  </svg>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function AddressMapPicker({ latitude, longitude, onChange }: Props) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);

  // Only used as the map's initial view — the dialog remounts this component
  // (defer-mount) each time it opens, so recomputing here is safe.
  const initialCenter = useMemo<[number, number]>(() => [latitude, longitude], []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      const marker = e.target as L.Marker;
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    },
    [onChange],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{t("addresses.form.mapHint")}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          <LocateFixed className="size-4" />
          {t("addresses.form.currentLocation")}
        </Button>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-[240px] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] sm:flex-1">
          <MapContainer center={initialCenter} zoom={12} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onChange={onChange} />
            <Marker
              position={[latitude, longitude]}
              icon={pinIcon}
              draggable
              eventHandlers={{ dragend: handleDragEnd }}
            />
          </MapContainer>
        </div>
        <div className="flex shrink-0 flex-row gap-3 sm:w-[140px] sm:flex-col">
          <div className="flex-1 space-y-1">
            <Label htmlFor="mapLatitude" className="text-xs text-[var(--color-muted)]">
              {t("addresses.form.latitude")}
            </Label>
            <Input id="mapLatitude" readOnly value={latitude.toFixed(6)} dir="ltr" className="text-left" />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="mapLongitude" className="text-xs text-[var(--color-muted)]">
              {t("addresses.form.longitude")}
            </Label>
            <Input id="mapLongitude" readOnly value={longitude.toFixed(6)} dir="ltr" className="text-left" />
          </div>
        </div>
      </div>
    </div>
  );
}
