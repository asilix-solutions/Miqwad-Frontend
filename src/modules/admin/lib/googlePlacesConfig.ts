/**
 * @file googlePlacesConfig.ts
 * @description Configuration helper for Google Places and Maps integration.
 * Safely reads Vite environment variables without leaking credentials into logs.
 */

export const GOOGLE_PLACE_ID_FINDER_URL =
  "https://developers.google.com/maps/documentation/places/web-service/place-id";

/**
 * Official Google Cloud Platform APIs required for the City Creation integration.
 */
export const GOOGLE_MAPS_REQUIRED_APIS = [
  "Maps JavaScript API",
  "Places API (New)",
] as const;

/**
 * Returns the Google Maps Platform browser API key from environment, if present and non-empty.
 */
export function getGoogleMapsApiKey(): string | null {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (typeof key === "string" && key.trim().length > 0) {
    return key.trim();
  }
  return null;
}

/**
 * Checks whether Google Places API is configured in the current client environment.
 */
export function isGooglePlacesConfigured(): boolean {
  return getGoogleMapsApiKey() !== null;
}

/**
 * Returns the configured Map ID from environment or 'DEMO_MAP_ID' for AdvancedMarkerElement.
 */
export function getGoogleMapsMapId(): string {
  const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
  if (typeof mapId === "string" && mapId.trim().length > 0) {
    return mapId.trim();
  }
  return "DEMO_MAP_ID";
}
