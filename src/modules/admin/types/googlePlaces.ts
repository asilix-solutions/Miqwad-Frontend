/**
 * @file googlePlaces.ts
 * @description Safe TypeScript definitions for modern Google Maps Platform Places & Maps API.
 * Uses current Google Maps JavaScript API (PlaceAutocompleteElement, Place, Map)
 * and eliminates deprecated AutocompleteService / legacy Autocomplete.
 */

export interface CityPlaceSelection {
  placeId: string;
  name: string;
  fullDescription: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

export interface GoogleMapsLatLng {
  lat: () => number;
  lng: () => number;
}

export interface GoogleMapsPlace {
  id?: string;
  place_id?: string;
  displayName?: string | { text: string };
  name?: string;
  formattedAddress?: string;
  location?:
    | GoogleMapsLatLng
    | { lat: number | (() => number); lng: number | (() => number) };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
    long_name?: string;
    short_name?: string;
  }>;
  fetchFields?: (options: { fields: string[] }) => Promise<void>;
}

export interface GooglePlacePrediction {
  toPlace: () => GoogleMapsPlace;
  placeId?: string;
  text?: { text: string };
}

export interface GooglePlaceAutocompleteElementOptions {
  includedPrimaryTypes?: string[];
  includedRegionCodes?: string[];
  types?: string[]; // Backward-compatibility
  componentRestrictions?: { country?: string | string[] }; // Backward-compatibility
  requestedLanguage?: string;
  requestedRegion?: string;
  placeholder?: string;
}

export interface GooglePlaceAutocompleteSelectEvent extends Event {
  placePrediction?: GooglePlacePrediction;
  place?: GoogleMapsPlace; // Fallback
}

export interface GooglePlaceAutocompleteElement extends HTMLElement {
  includedPrimaryTypes?: string[];
  includedRegionCodes?: string[];
  types?: string[];
  componentRestrictions?: { country?: string | string[] };
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export interface GooglePlacesNamespace {
  PlaceAutocompleteElement?: new (
    options?: GooglePlaceAutocompleteElementOptions,
  ) => GooglePlaceAutocompleteElement;
  Place?: new (options: { id: string }) => GoogleMapsPlace;
}

export interface GoogleMapsMapMouseEvent {
  latLng: {
    lat: () => number;
    lng: () => number;
  };
}

export interface GoogleMapsMapInstance {
  setCenter: (latLng: { lat: number; lng: number } | GoogleMapsLatLng) => void;
  panTo: (latLng: { lat: number; lng: number } | GoogleMapsLatLng) => void;
  setZoom: (zoom: number) => void;
  getZoom?: () => number;
  getCenter?: () => GoogleMapsLatLng | { lat: () => number; lng: () => number };
  addListener: (
    eventName: string,
    handler: (e: GoogleMapsMapMouseEvent) => void,
  ) => { remove: () => void };
}

export interface GoogleMapsMarkerInstance {
  setPosition: (latLng: { lat: number; lng: number } | GoogleMapsLatLng) => void;
  setMap: (map: GoogleMapsMapInstance | null) => void;
  getPosition?: () => GoogleMapsLatLng | { lat: () => number; lng: () => number } | null;
  addListener: (
    eventName: string,
    handler: (e: GoogleMapsMapMouseEvent) => void,
  ) => { remove: () => void };
}

export interface GoogleAdvancedMarkerInstance extends HTMLElement {
  map: GoogleMapsMapInstance | null;
  position: { lat: number; lng: number } | GoogleMapsLatLng | null;
  gmpDraggable?: boolean;
  addEventListener: (
    eventName: string,
    handler: (e: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    eventName: string,
    handler: (e: Event) => void,
    options?: boolean | EventListenerOptions,
  ) => void;
}

export interface GoogleMapsWindow {
  gm_authFailure?: () => void;
  google?: {
    maps?: {
      places?: GooglePlacesNamespace;
      Map?: new (
        element: HTMLElement,
        options?: Record<string, unknown>,
      ) => GoogleMapsMapInstance;
      Marker?: new (
        options?: Record<string, unknown>,
      ) => GoogleMapsMarkerInstance;
      marker?: {
        AdvancedMarkerElement?: new (
          options?: Record<string, unknown>,
        ) => GoogleAdvancedMarkerInstance;
      };
      importLibrary?: (libraryName: string) => Promise<unknown>;
    };
  };
}

export type PlacesLoaderStatus =
  | "unconfigured" // API key not configured in environment
  | "loading" // Script is currently downloading
  | "ready" // Google Maps Places API is ready for use
  | "error"; // Failed to download or initialize script

/**
 * Granular classification of Google Places errors to enable differentiated user messages.
 */
export type GooglePlacesErrorType =
  | "unconfigured" // Missing local API key configuration
  | "script_load_error" // Network or DNS script loading failure
  | "library_error" // Places library import/initialization failure
  | "auth_error" // Google Maps API authorization/credential failure (e.g. gm_authFailure)
  | "component_error"; // PlaceAutocompleteElement UI element creation failure

export interface UseGooglePlacesApiReturn {
  status: PlacesLoaderStatus;
  isConfigured: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  errorType: GooglePlacesErrorType | null;
}
