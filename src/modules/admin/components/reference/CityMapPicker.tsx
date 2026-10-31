/**
 * @file CityMapPicker.tsx
 * @description Integrated coordinate picker for city location selection.
 * When Google Maps is configured and ready:
 * - Renders an integrated Google Map (google.maps.Map).
 * - Synchronizes position with selected Google Place.
 * - Supports clicking to place the pin and dragging the marker to fine-tune coordinates.
 * When Google Maps is unconfigured or offline:
 * - Falls back to Leaflet / OpenStreetMap map so administrators can continue working.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGooglePlacesApi } from "../../hooks/useGooglePlacesApi";
import { getGoogleMapsMapId } from "../../lib/googlePlacesConfig";
import type {
  GoogleMapsWindow,
  GoogleMapsMapInstance,
  GoogleMapsMarkerInstance,
  GoogleAdvancedMarkerInstance,
  GoogleMapsMapMouseEvent,
} from "../../types/googlePlaces";

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}

// Leaflet fallback pin icon
const pinIcon = L.divIcon({
  className: "city-map-pin",
  html: `<div style="transform: translate(-50%, -100%);">
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16C0 27.5 16 42 16 42C16 42 32 27.5 32 16C32 7.163 24.837 0 16 0Z" fill="#F45E2B"/>
      <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function LeafletMapClickHandler({
  onChange,
  disabled,
}: {
  onChange: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));
      onChange(lat, lng);
    },
  });
  return null;
}

function LeafletMapViewUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      const center = map.getCenter();
      const dist = Math.abs(center.lat - lat) + Math.abs(center.lng - lng);
      if (dist > 0.001) {
        map.setView([lat, lng], map.getZoom(), { animate: true });
      }
    }
  }, [lat, lng, map]);
  return null;
}

export function CityMapPicker({ latitude, longitude, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { isReady: isGoogleReady } = useGooglePlacesApi();
  const [locating, setLocating] = useState(false);

  const googleMapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<GoogleMapsMapInstance | null>(null);
  const googleMarkerInstanceRef = useRef<GoogleMapsMarkerInstance | null>(null);
  const googleAdvancedMarkerRef = useRef<GoogleAdvancedMarkerInstance | null>(null);

  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  // Initialize and manage Google Map when Google Maps API is ready
  useEffect(() => {
    if (!isGoogleReady || !googleMapContainerRef.current) {
      return;
    }

    const gWin = window as unknown as GoogleMapsWindow;
    if (!gWin.google?.maps?.Map) {
      return;
    }

    const centerPos = {
      lat: hasValidCoordinates ? latitude : 24.7136,
      lng: hasValidCoordinates ? longitude : 46.6753,
    };

    const mapId = getGoogleMapsMapId();

    const map = new gWin.google.maps.Map(googleMapContainerRef.current, {
      center: centerPos,
      zoom: hasValidCoordinates ? 11 : 6,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      mapId,
    });

    googleMapInstanceRef.current = map;

    // Prefer modern AdvancedMarkerElement when marker library is available
    const AdvancedMarkerClass = gWin.google?.maps?.marker?.AdvancedMarkerElement;

    if (AdvancedMarkerClass) {
      let advancedMarker: GoogleAdvancedMarkerInstance | null = null;
      if (hasValidCoordinates) {
        advancedMarker = new AdvancedMarkerClass({
          map,
          position: centerPos,
          gmpDraggable: !disabled,
          title: "City Center",
        });
      }
      googleAdvancedMarkerRef.current = advancedMarker;

      const handleAdvancedDragEnd = () => {
        if (disabled) return;
        const pos = googleAdvancedMarkerRef.current?.position;
        if (pos) {
          const lat = Number((typeof pos.lat === "function" ? pos.lat() : pos.lat).toFixed(6));
          const lng = Number((typeof pos.lng === "function" ? pos.lng() : pos.lng).toFixed(6));
          onChange(lat, lng);
        }
      };

      if (advancedMarker) {
        advancedMarker.addEventListener("gmp-dragend", handleAdvancedDragEnd);
      }

      const clickListener = map.addListener("click", (e: GoogleMapsMapMouseEvent) => {
        if (disabled) return;
        const lat = Number(e.latLng.lat().toFixed(6));
        const lng = Number(e.latLng.lng().toFixed(6));
        if (!googleAdvancedMarkerRef.current) {
          const newMarker = new AdvancedMarkerClass({
            map,
            position: { lat, lng },
            gmpDraggable: !disabled,
            title: "City Center",
          });
          newMarker.addEventListener("gmp-dragend", handleAdvancedDragEnd);
          googleAdvancedMarkerRef.current = newMarker;
        } else {
          googleAdvancedMarkerRef.current.map = map;
          googleAdvancedMarkerRef.current.position = { lat, lng };
        }
        onChange(lat, lng);
      });

      return () => {
        clickListener?.remove();
        if (googleAdvancedMarkerRef.current) {
          googleAdvancedMarkerRef.current.removeEventListener("gmp-dragend", handleAdvancedDragEnd);
          googleAdvancedMarkerRef.current.map = null;
        }
        googleMapInstanceRef.current = null;
        googleAdvancedMarkerRef.current = null;
      };
    } else if (gWin.google?.maps?.Marker) {
      const MarkerClass = gWin.google.maps.Marker;
      // Graceful fallback to legacy google.maps.Marker if AdvancedMarkerElement is unavailable
      let marker: GoogleMapsMarkerInstance | null = null;
      if (hasValidCoordinates) {
        marker = new MarkerClass({
          position: centerPos,
          map,
          draggable: !disabled,
        });
      }
      googleMarkerInstanceRef.current = marker;

      const dragListener = () => {
        if (disabled) return;
        const pos = googleMarkerInstanceRef.current?.getPosition?.();
        if (pos) {
          const lat = Number(pos.lat().toFixed(6));
          const lng = Number(pos.lng().toFixed(6));
          onChange(lat, lng);
        }
      };

      if (marker) {
        marker.addListener("dragend", dragListener);
      }

      const clickListener = map.addListener("click", (e: GoogleMapsMapMouseEvent) => {
        if (disabled) return;
        const lat = Number(e.latLng.lat().toFixed(6));
        const lng = Number(e.latLng.lng().toFixed(6));
        if (!googleMarkerInstanceRef.current) {
          const newMarker = new MarkerClass({
            position: { lat, lng },
            map,
            draggable: !disabled,
          });
          newMarker.addListener("dragend", dragListener);
          googleMarkerInstanceRef.current = newMarker;
        } else {
          googleMarkerInstanceRef.current.setMap(map);
          googleMarkerInstanceRef.current.setPosition({ lat, lng });
        }
        onChange(lat, lng);
      });

      return () => {
        clickListener?.remove();
        if (googleMarkerInstanceRef.current) {
          googleMarkerInstanceRef.current.setMap(null);
        }
        googleMapInstanceRef.current = null;
        googleMarkerInstanceRef.current = null;
      };
    }

    return () => {
      googleMapInstanceRef.current = null;
    };
  }, [isGoogleReady, disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize Google Map and marker when latitude/longitude change externally
  useEffect(() => {
    if (!isGoogleReady || !googleMapInstanceRef.current) {
      return;
    }

    const gWin = window as unknown as GoogleMapsWindow;
    const map = googleMapInstanceRef.current;

    if (!hasValidCoordinates) {
      if (googleAdvancedMarkerRef.current) {
        googleAdvancedMarkerRef.current.map = null;
      }
      if (googleMarkerInstanceRef.current) {
        googleMarkerInstanceRef.current.setMap(null);
      }
      return;
    }

    const newPos = { lat: latitude!, lng: longitude! };
    const AdvancedMarkerClass = gWin.google?.maps?.marker?.AdvancedMarkerElement;

    if (AdvancedMarkerClass) {
      if (!googleAdvancedMarkerRef.current) {
        const advancedMarker = new AdvancedMarkerClass({
          map,
          position: newPos,
          gmpDraggable: !disabled,
          title: "City Center",
        });
        const handleAdvancedDragEnd = () => {
          if (disabled) return;
          const pos = advancedMarker.position;
          if (pos) {
            const lat = Number((typeof pos.lat === "function" ? pos.lat() : pos.lat).toFixed(6));
            const lng = Number((typeof pos.lng === "function" ? pos.lng() : pos.lng).toFixed(6));
            onChange(lat, lng);
          }
        };
        advancedMarker.addEventListener("gmp-dragend", handleAdvancedDragEnd);
        googleAdvancedMarkerRef.current = advancedMarker;
      } else {
        googleAdvancedMarkerRef.current.map = map;
        googleAdvancedMarkerRef.current.position = newPos;
      }
    } else if (gWin.google?.maps?.Marker) {
      if (!googleMarkerInstanceRef.current) {
        const marker = new gWin.google.maps.Marker({
          position: newPos,
          map,
          draggable: !disabled,
        });
        const handleDragEnd = () => {
          if (disabled) return;
          const pos = marker.getPosition?.();
          if (pos) {
            const lat = Number(pos.lat().toFixed(6));
            const lng = Number(pos.lng().toFixed(6));
            onChange(lat, lng);
          }
        };
        marker.addListener("dragend", handleDragEnd);
        googleMarkerInstanceRef.current = marker;
      } else {
        googleMarkerInstanceRef.current.setMap(map);
        googleMarkerInstanceRef.current.setPosition(newPos);
      }
    }

    const center = map.getCenter?.();
    const currentLat = typeof center?.lat === "function" ? center.lat() : undefined;
    const currentLng = typeof center?.lng === "function" ? center.lng() : undefined;

    if (
      currentLat === undefined ||
      Math.abs(currentLat - latitude!) > 0.001 ||
      Math.abs(currentLng! - longitude!) > 0.001
    ) {
      map.panTo(newPos);
      if (map.getZoom && map.getZoom() < 10) {
        map.setZoom(11);
      }
    }
  }, [isGoogleReady, latitude, longitude, hasValidCoordinates, disabled, onChange]);

  // Leaflet fallback center
  const leafletInitialCenter = useMemo<[number, number]>(() => {
    if (hasValidCoordinates) {
      return [latitude!, longitude!];
    }
    return [24.7136, 46.6753];
  }, [hasValidCoordinates, latitude, longitude]);

  const handleLeafletDragEnd = useCallback(
    (e: L.DragEndEvent) => {
      if (disabled) return;
      const marker = e.target as L.Marker;
      const pos = marker.getLatLng();
      onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
    },
    [disabled, onChange],
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation || disabled) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6)),
        );
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--color-ink-muted)]">
          {t("superAdmin.cities.form.mapTitle")}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={useCurrentLocation}
          disabled={locating || disabled}
          className="h-7 text-xs text-[var(--color-brand-orange)] hover:bg-[var(--color-surface-2)]"
        >
          <LocateFixed className="size-3.5 me-1.5" />
          {t("superAdmin.cities.form.currentLocation")}
        </Button>
      </div>

      <div className="h-[240px] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] relative">
        {isGoogleReady ? (
          /* Genuine Google Map Display */
          <div ref={googleMapContainerRef} className="h-full w-full" />
        ) : (
          /* Graceful Leaflet Map Fallback when Google Maps is Unconfigured / Offline */
          <MapContainer
            center={leafletInitialCenter}
            zoom={hasValidCoordinates ? 7 : 5}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LeafletMapClickHandler onChange={onChange} disabled={disabled} />
            {hasValidCoordinates && (
              <>
                <Marker
                  position={[latitude!, longitude!]}
                  icon={pinIcon}
                  draggable={!disabled}
                  eventHandlers={{
                    dragend: handleLeafletDragEnd,
                  }}
                />
                <LeafletMapViewUpdater lat={latitude!} lng={longitude!} />
              </>
            )}
          </MapContainer>
        )}
      </div>

      <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
        {t("superAdmin.cities.form.mapHint")}
      </p>
    </div>
  );
}
