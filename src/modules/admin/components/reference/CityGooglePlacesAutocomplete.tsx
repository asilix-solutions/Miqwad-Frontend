/**
 * @file CityGooglePlacesAutocomplete.tsx
 * @description Modern Google Places city autocomplete control for City creation flow.
 * Complies with modern Google Maps Platform JavaScript API (Places library v3.56+):
 * - Uses modern PlaceAutocompleteElement and Place (fetchFields).
 * - Avoids deprecated legacy autocomplete APIs.
 * - Restricts suggestions to (cities) within the supported country (defaults to SA).
 * - Enforces selection from genuine Google Place predictions; arbitrary typed text does not become a Place ID.
 * - Extracts confirmed placeId, display name, and ISO country code from addressComponents.
 * - Displays a clean confirmation card with city name, country, and human-friendly "Change City" action.
 * - Completely removes manual Place ID input, copy buttons, technical Place ID display, and fallback toggles.
 * - Prevents asynchronous race conditions and invalidates stale selections on country/input changes.
 * - Preserves Google Places data boundary: does NOT fetch or forward Google-derived coordinates to Leaflet/OSM.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGooglePlacesApi } from "../../hooks/useGooglePlacesApi";
import type {
  CityPlaceSelection,
  GoogleMapsWindow,
  GoogleMapsPlace,
  GooglePlaceAutocompleteElement,
  GooglePlaceAutocompleteSelectEvent,
  GooglePlacesErrorType,
} from "../../types/googlePlaces";

interface Props {
  countryCode?: string;
  value: string; // The current form googlePlaceId
  onChange: (placeId: string) => void;
  onSelectPlace?: (selection: CityPlaceSelection) => void;
  disabled?: boolean;
  error?: string;
}

export function CityGooglePlacesAutocomplete({
  countryCode = "SA",
  value,
  onChange,
  onSelectPlace,
  disabled,
  error,
}: Props) {
  const { t } = useTranslation();
  const {
    isConfigured,
    isReady,
    isLoading: isScriptLoading,
    error: loaderError,
    errorType: loaderErrorType,
  } = useGooglePlacesApi();

  const [selectedPlace, setSelectedPlace] = useState<CityPlaceSelection | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [prevCountry, setPrevCountry] = useState(countryCode);
  const [prevValue, setPrevValue] = useState(value);

  // Adjust state during render when countryCode changes to prevent cross-country mismatch
  if (prevCountry !== countryCode) {
    setPrevCountry(countryCode);
    if (selectedPlace) {
      setSelectedPlace(null);
    }
  }

  // Adjust state during render when value is externally cleared (e.g. form reset)
  if (prevValue !== value) {
    setPrevValue(value);
    if (!value && selectedPlace) {
      setSelectedPlace(null);
    }
  }

  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const latestFetchIdRef = useRef(0);
  const isMountedRef = useRef(true);

  // Derive active place synchronously: only valid when value matches selectedPlace.placeId
  const activePlace =
    value && selectedPlace && selectedPlace.placeId === value ? selectedPlace : null;

  // Track component mounted lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // When countryCode changes and value exists, notify parent to clear value
  useEffect(() => {
    if (prevCountry !== countryCode && value) {
      onChange("");
    }
  }, [countryCode, prevCountry, value, onChange]);

  // Clear selected place to search again
  const handleClearSelection = useCallback(() => {
    latestFetchIdRef.current++;
    setSelectedPlace(null);
    onChange("");
  }, [onChange]);

  // Mount modern PlaceAutocompleteElement when Google Places is ready
  useEffect(() => {
    if (!isReady || (value && activePlace)) {
      return;
    }

    const container = autocompleteContainerRef.current;
    if (!container) return;

    // Clean previous element
    container.innerHTML = "";

    const gWin = window as unknown as GoogleMapsWindow;
    const normCountry = (countryCode || "SA").toLowerCase().trim();

    let element: HTMLElement | null = null;

    try {
      if (gWin.google?.maps?.places?.PlaceAutocompleteElement) {
        element = new gWin.google.maps.places.PlaceAutocompleteElement({
          includedPrimaryTypes: ["locality"],
          includedRegionCodes: [normCountry],
          types: ["(cities)"], // Backward compatibility
          componentRestrictions: { country: [normCountry] }, // Backward compatibility
          requestedLanguage: "ar",
          requestedRegion: normCountry.toUpperCase(),
        });
      } else if (
        typeof customElements !== "undefined" &&
        customElements.get("gmp-place-autocomplete-element")
      ) {
        element = document.createElement("gmp-place-autocomplete-element");
        const customEl = element as GooglePlaceAutocompleteElement;
        customEl.includedPrimaryTypes = ["locality"];
        customEl.includedRegionCodes = [normCountry];
        customEl.types = ["(cities)"];
        customEl.componentRestrictions = { country: [normCountry] };
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("[GooglePlaces] Could not instantiate PlaceAutocompleteElement:", e);
      }
    }

    if (!element) {
      Promise.resolve().then(() => {
        if (isMountedRef.current) {
          setComponentError("Failed to initialize PlaceAutocompleteElement");
        }
      });
      return;
    }

    Promise.resolve().then(() => {
      if (isMountedRef.current) {
        setComponentError(null);
      }
    });

    activeElementRef.current = element;

    const handlePlaceSelect = async (event: Event) => {
      const fetchId = ++latestFetchIdRef.current;
      const selectEvent = event as GooglePlaceAutocompleteSelectEvent;

      try {
        let place: GoogleMapsPlace | undefined;

        if (
          selectEvent.placePrediction &&
          typeof selectEvent.placePrediction.toPlace === "function"
        ) {
          place = selectEvent.placePrediction.toPlace();
        } else if (selectEvent.place) {
          place = selectEvent.place;
        }

        if (!place) {
          throw new Error("No place or placePrediction found in selection event");
        }

        // Section 6: Retrieve only the Google Place fields necessary for city identity and country selection.
        // Google-derived coordinates are NOT requested or transferred into Leaflet/OSM or City records.
        if (typeof place.fetchFields === "function") {
          await place.fetchFields({
            fields: ["id", "displayName", "formattedAddress", "addressComponents"],
          });
        }

        // Race condition check: If another selection/reset happened while waiting for fetchFields, discard!
        if (fetchId !== latestFetchIdRef.current || !isMountedRef.current) {
          return;
        }

        const placeId = place.id || place.place_id || "";
        if (!placeId) {
          throw new Error("Missing placeId in Google Place details");
        }

        let name = "";
        if (typeof place.displayName === "string") {
          name = place.displayName;
        } else if (place.displayName?.text) {
          name = place.displayName.text;
        } else if (place.formattedAddress) {
          name = place.formattedAddress;
        } else if (place.name) {
          name = place.name;
        }

        // Extract ISO country code and country name from verified addressComponents
        let extractedCountryCode = "";
        let extractedCountryName = "";
        if (Array.isArray(place.addressComponents)) {
          const countryComp = place.addressComponents.find((comp) =>
            Array.isArray(comp.types) && comp.types.includes("country"),
          );
          if (countryComp) {
            extractedCountryCode = (
              countryComp.shortText ||
              (countryComp as unknown as { short_name?: string }).short_name ||
              ""
            ).trim().toUpperCase();
            extractedCountryName = (
              countryComp.longText ||
              (countryComp as unknown as { long_name?: string }).long_name ||
              ""
            ).trim();
          }
        }

        const selection: CityPlaceSelection = {
          placeId,
          name: name.trim(),
          fullDescription: place.formattedAddress || name,
          countryCode: extractedCountryCode || undefined,
          countryName: extractedCountryName || undefined,
        };

        setSelectedPlace(selection);
        onChange(placeId);
        onSelectPlace?.(selection);
      } catch (err) {
        if (fetchId === latestFetchIdRef.current && isMountedRef.current) {
          console.error("Error retrieving place details from Google Places:", err);
          // Clear any partial selection to prevent submitting stale or incomplete data
          setSelectedPlace(null);
          onChange("");
        }
      }
    };

    // If user types in the autocomplete search box, any previous Place ID is invalidated
    const handleInput = () => {
      if (value) {
        latestFetchIdRef.current++;
        setSelectedPlace(null);
        onChange("");
      }
    };

    // Attach to current official GA event 'gmp-select' and keep 'gmp-placeselect' for backward compatibility
    element.addEventListener("gmp-select", handlePlaceSelect);
    element.addEventListener("gmp-placeselect", handlePlaceSelect);
    element.addEventListener("input", handleInput);
    container.appendChild(element);

    return () => {
      element?.removeEventListener("gmp-select", handlePlaceSelect);
      element?.removeEventListener("gmp-placeselect", handlePlaceSelect);
      element?.removeEventListener("input", handleInput);
      if (container) {
        container.innerHTML = "";
      }
      activeElementRef.current = null;
    };
  }, [isReady, countryCode, value, activePlace, onChange, onSelectPlace]);

  // ── CASE 1: Google Places NOT configured OR loading / initialization error ──
  const hasError =
    !isConfigured ||
    Boolean(loaderError) ||
    Boolean(loaderErrorType) ||
    Boolean(componentError);

  if (hasError) {
    const activeErrorType: GooglePlacesErrorType = !isConfigured
      ? "unconfigured"
      : componentError
        ? "component_error"
        : loaderErrorType || "script_load_error";

    let title = t("superAdmin.cities.form.placesConfigMissingTitle");
    let desc = t("superAdmin.cities.form.placesConfigMissingDesc");

    if (activeErrorType === "auth_error") {
      title = t("superAdmin.cities.form.placesAuthErrorTitle");
      desc = t("superAdmin.cities.form.placesAuthErrorDesc");
    } else if (activeErrorType === "library_error") {
      title = t("superAdmin.cities.form.placesLibraryErrorTitle");
      desc = t("superAdmin.cities.form.placesLibraryErrorDesc");
    } else if (activeErrorType === "component_error") {
      title = t("superAdmin.cities.form.placesComponentErrorTitle");
      desc = t("superAdmin.cities.form.placesComponentErrorDesc");
    } else if (activeErrorType === "script_load_error") {
      title = t("superAdmin.cities.form.placesScriptLoadErrorTitle");
      desc = t("superAdmin.cities.form.placesScriptLoadErrorDesc");
    }

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--color-ink-body)]">
          {t("superAdmin.cities.form.placesAutocompleteLabel")}{" "}
          <span className="text-danger-500">*</span>
        </label>
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50/70 p-3 text-xs space-y-1">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-900">{title}</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">{desc}</p>
            </div>
          </div>
        </div>
        {error && <p className="text-xs text-danger-500">{error}</p>}
      </div>
    );
  }

  // ── CASE 2: Configured, genuine Google Place has been selected ──
  if (value && activePlace) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[var(--color-ink-body)]">
          {t("superAdmin.cities.form.placesSelectedCity")}{" "}
          <span className="text-danger-500">*</span>
        </label>

        <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50/60 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--color-ink-body)] truncate">
                {activePlace.name}
              </p>
              {(activePlace.countryName || activePlace.countryCode || activePlace.fullDescription) && (
                <p className="text-xs text-[var(--color-ink-muted)] truncate mt-0.5">
                  {activePlace.countryName
                    ? `${activePlace.countryName} (${activePlace.countryCode})`
                    : activePlace.countryCode
                      ? `${activePlace.fullDescription || activePlace.name} - ${activePlace.countryCode}`
                      : activePlace.fullDescription}
                </p>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={handleClearSelection}
            className="h-8 text-xs text-[var(--color-ink-muted)] hover:text-danger-600 hover:bg-danger-50 shrink-0 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>{t("superAdmin.cities.form.placesChangeCity")}</span>
          </Button>
        </div>

        {error && <p className="text-xs text-danger-500">{error}</p>}
      </div>
    );
  }

  // ── CASE 3: Google Places configured, searching using PlaceAutocompleteElement ──
  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-semibold text-[var(--color-ink-body)]">
        {t("superAdmin.cities.form.placesAutocompleteLabel")}{" "}
        <span className="text-danger-500">*</span>
      </label>

      {isScriptLoading ? (
        <div className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface-2,#fafafc)] px-3 flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <Loader2 className="size-4 animate-spin text-[var(--color-brand-orange)]" />
          <span>{t("superAdmin.cities.form.placesSearchLoading")}</span>
        </div>
      ) : (
        <div
          ref={autocompleteContainerRef}
          className="w-full min-h-[44px] rounded-[var(--radius-md)] [&_gmp-place-autocomplete-element]:w-full"
        />
      )}

      <p className="text-[11px] text-[var(--color-muted)]">
        {t("superAdmin.cities.form.placesTypePrompt")}
      </p>

      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
