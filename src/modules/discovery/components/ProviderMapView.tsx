import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import type { NearbyProvider } from "../types";

/**
 * Map view for the nearby search page (Leaflet + OpenStreetMap).
 *
 * Two marker variants:
 *  - "user" pin (blue dot) at the search origin
 *  - "provider" pin (brand pin) at each result location
 *
 * The map is kept declarative (no imperative refs) so the parent
 * (Redux) is the source of truth. When `origin` or `providers` change,
 * we use a small inner component to fitBounds so all markers are visible.
 */

// Leaflet's default marker assets fail in Vite (paths not bundled).
// We build inline SVG-based DivIcons so the icons are self-contained
// and respect our design tokens.
const providerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 32px;
      height: 40px;
      transform: translate(-50%, -100%);
      position: relative;
    ">
      <svg viewBox="0 0 32 40" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z"
              fill="#F45E2B" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="#fff"/>
      </svg>
    </div>
  `,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
});

const originIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 20px;
      height: 20px;
      transform: translate(-50%, -50%);
      border-radius: 9999px;
      background: #043168;
      border: 3px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Props {
  origin: { lat: number; lng: number };
  providers: NearbyProvider[];
  radiusKm: number;
  /** Optional fixed height — defaults to a tall map that scrolls on mobile. */
  className?: string;
}

export function ProviderMapView({ origin, providers, radiusKm, className }: Props) {
  return (
    <div
      className={
        className ??
        "rounded-[var(--radius-lg)] overflow-hidden border border-ink-200 bg-white h-[60vh] sm:h-[70vh]"
      }
    >
      <MapContainer
        center={[origin.lat, origin.lng]}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={[origin.lat, origin.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#043168",
            fillColor: "#043168",
            fillOpacity: 0.05,
            weight: 1,
          }}
        />

        <Marker position={[origin.lat, origin.lng]} icon={originIcon} />

        {providers.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={providerIcon}>
            <Popup>
              <ProviderPopup provider={p} />
            </Popup>
          </Marker>
        ))}

        <FitBoundsOnChange
          origin={origin}
          providers={providers}
          radiusKm={radiusKm}
        />
      </MapContainer>
    </div>
  );
}

function ProviderPopup({ provider }: { provider: NearbyProvider }) {
  const { t } = useTranslation();
  return (
    <div className="min-w-[200px]">
      <p className="font-display font-semibold text-ink-900 mb-1">
        {provider.companyName}
      </p>
      <p className="text-xs text-ink-500 mb-2">
        {t("discovery.distanceKm", { km: provider.distanceKm.toFixed(1) })}
        {provider.rating > 0 && (
          <span className="ms-2 inline-flex items-center gap-0.5 text-warning-500">
            <Star className="h-3 w-3 fill-current" /> {provider.rating.toFixed(1)}
          </span>
        )}
      </p>
      <Link
        to={`/app/services/providers/${provider.id}`}
        className="text-brand-600 text-xs font-medium hover:underline"
      >
        {t("discovery.viewDetails")} →
      </Link>
    </div>
  );
}

/**
 * Re-centers the map whenever the search origin/results change so the
 * user always sees the whole circle + markers. Uses padding so markers
 * aren't flush against the viewport edges.
 */
function FitBoundsOnChange({
  origin,
  providers,
  radiusKm,
}: Props) {
  const map = useMap();
  useEffect(() => {
    if (providers.length === 0) {
      // No results → just centre on origin with a sensible zoom.
      map.setView([origin.lat, origin.lng], Math.max(11, 14 - Math.log2(radiusKm)));
      return;
    }
    const bounds = L.latLngBounds(
      providers.map((p) => [p.lat, p.lng] as [number, number]),
    );
    bounds.extend([origin.lat, origin.lng]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [origin.lat, origin.lng, providers, radiusKm, map]);
  return null;
}
