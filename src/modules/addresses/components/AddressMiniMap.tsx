/**
 * @file AddressMiniMap.tsx
 * @description Small, non-interactive Leaflet thumbnail centered on one
 * address (dragging/zoom/scroll all disabled — a static preview, not a
 * picker). Icon setup mirrors AddressMapPicker.tsx / ProviderMapView.tsx
 * (Leaflet's default marker assets break under Vite, so a divIcon is used).
 */
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  latitude: number;
  longitude: number;
  alt: string;
}

const miniPinIcon = L.divIcon({
  className: "",
  html: `<svg width="22" height="29" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25c0-8.284-6.716-15-15-15z" fill="#F45E2B"/>
    <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
  </svg>`,
  iconSize: [22, 29],
  iconAnchor: [11, 29],
});

export function AddressMiniMap({ latitude, longitude, alt }: Props) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      className="isolate h-full w-full"
      dragging={false}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
      aria-label={alt}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[latitude, longitude]} icon={miniPinIcon} />
    </MapContainer>
  );
}
