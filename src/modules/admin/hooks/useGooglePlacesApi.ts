/**
 * @file useGooglePlacesApi.ts
 * @description Hook for dynamically and safely loading modern Google Maps & Places Platform API scripts.
 * Features:
 * - Zero network requests if API key is not configured in VITE_GOOGLE_MAPS_API_KEY.
 * - Idempotent script injection with deduplication.
 * - Loads 'places', 'maps', and 'marker' libraries under weekly version.
 * - Supports modern dynamic importLibrary (places, maps).
 * - Clean status transitions: 'unconfigured' | 'loading' | 'ready' | 'error'.
 * - Preserves RTL / Arabic language configuration.
 */

import { useEffect, useState } from "react";
import { getGoogleMapsApiKey } from "../lib/googlePlacesConfig";
import type {
  GoogleMapsWindow,
  PlacesLoaderStatus,
  GooglePlacesErrorType,
  UseGooglePlacesApiReturn,
} from "../types/googlePlaces";

const SCRIPT_ID = "google-maps-platform-script";

// Tracks whether Google Maps authorization failed during this session across component re-mounts.
let sessionAuthFailure = false;

export function useGooglePlacesApi(): UseGooglePlacesApiReturn {
  const apiKey = getGoogleMapsApiKey();
  const isConfigured = Boolean(apiKey);

  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">(() => {
    if (!apiKey) return "loading";
    if (sessionAuthFailure) return "error";
    if (typeof window === "undefined") return "loading";
    const win = window as unknown as GoogleMapsWindow;
    return win.google?.maps?.places?.PlaceAutocompleteElement || win.google?.maps?.places
      ? "ready"
      : "loading";
  });

  const [errorType, setErrorType] = useState<GooglePlacesErrorType | null>(() => {
    if (!apiKey) return "unconfigured";
    if (sessionAuthFailure) return "auth_error";
    return null;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (sessionAuthFailure) return "Google Maps Platform authentication failure";
    return null;
  });

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    if (sessionAuthFailure) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const win = window as unknown as GoogleMapsWindow;

    // Register gm_authFailure handler to detect Google Maps authorization failures.
    // Preserves any existing handler and performs cleanup on unmount.
    const prevGmAuthFailure = win.gm_authFailure;
    const handleAuthFailure = () => {
      sessionAuthFailure = true;
      if (typeof prevGmAuthFailure === "function") {
        try {
          prevGmAuthFailure();
        } catch {
          // Suppress errors in third-party handlers
        }
      }
      setScriptStatus("error");
      setErrorType("auth_error");
      setErrorMessage("Google Maps Platform authentication failure");
      if (import.meta.env.DEV) {
        console.warn(
          "[GooglePlaces] Google Maps authentication failed (gm_authFailure). Verify API key, HTTP referrer restrictions, and billing in Google Cloud Console.",
        );
      }
    };
    win.gm_authFailure = handleAuthFailure;

    // Check if already initialized and ready
    if (win.google?.maps?.places?.PlaceAutocompleteElement) {
      Promise.resolve().then(() => {
        setScriptStatus("ready");
        setErrorType(null);
        setErrorMessage(null);
      });
      return () => {
        if (win.gm_authFailure === handleAuthFailure) {
          win.gm_authFailure = prevGmAuthFailure;
        }
      };
    }

    // If Google Maps is loaded and supports importLibrary, import required libraries
    if (win.google?.maps?.importLibrary) {
      Promise.all([
        win.google.maps.importLibrary("places"),
        win.google.maps.importLibrary("maps"),
        win.google.maps.importLibrary("marker").catch(() => null),
      ])
        .then(() => {
          setScriptStatus("ready");
          setErrorType(null);
          setErrorMessage(null);
        })
        .catch((err) => {
          setScriptStatus("error");
          setErrorType("library_error");
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to import Google Maps libraries",
          );
          if (import.meta.env.DEV) {
            console.warn("[GooglePlaces] Failed to import Google Maps libraries:", err);
          }
        });
      return () => {
        if (win.gm_authFailure === handleAuthFailure) {
          win.gm_authFailure = prevGmAuthFailure;
        }
      };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = async () => {
      if (script) {
        script.dataset.loaded = "true";
      }
      const gWin = window as unknown as GoogleMapsWindow;
      try {
        if (gWin.google?.maps?.importLibrary) {
          await Promise.all([
            gWin.google.maps.importLibrary("places"),
            gWin.google.maps.importLibrary("maps"),
            gWin.google.maps.importLibrary("marker").catch(() => null),
          ]);
        }

        setScriptStatus("ready");
        setErrorType(null);
        setErrorMessage(null);
      } catch (err) {
        setScriptStatus("error");
        setErrorType("library_error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Google Maps Places library initialization failed",
        );
        if (import.meta.env.DEV) {
          console.warn("[GooglePlaces] Library initialization error:", err);
        }
      }
    };

    const handleError = () => {
      if (script) {
        script.dataset.failed = "true";
      }
      setScriptStatus("error");
      setErrorType("script_load_error");
      setErrorMessage("Failed to load Google Maps script from Google Cloud Platform");
      if (import.meta.env.DEV) {
        console.warn("[GooglePlaces] Failed to load Google Maps script (network or DNS error).");
      }
    };

    if (script) {
      if (script.dataset.failed === "true") {
        Promise.resolve().then(handleError);
        return () => {
          if (win.gm_authFailure === handleAuthFailure) {
            win.gm_authFailure = prevGmAuthFailure;
          }
        };
      }
      if (script.dataset.loaded === "true" || win.google?.maps) {
        Promise.resolve().then(handleLoad);
        return () => {
          if (win.gm_authFailure === handleAuthFailure) {
            win.gm_authFailure = prevGmAuthFailure;
          }
        };
      }
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      return () => {
        if (win.gm_authFailure === handleAuthFailure) {
          win.gm_authFailure = prevGmAuthFailure;
        }
        script?.removeEventListener("load", handleLoad);
        script?.removeEventListener("error", handleError);
      };
    }

    script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,maps,marker&v=weekly&language=ar&loading=async`;

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    return () => {
      if (win.gm_authFailure === handleAuthFailure) {
        win.gm_authFailure = prevGmAuthFailure;
      }
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [apiKey]);

  const status: PlacesLoaderStatus = !isConfigured ? "unconfigured" : scriptStatus;
  const effectiveErrorType: GooglePlacesErrorType | null = !isConfigured
    ? "unconfigured"
    : errorType;

  return {
    status,
    isConfigured,
    isReady: status === "ready",
    isLoading: status === "loading",
    error: errorMessage,
    errorType: effectiveErrorType,
  };
}

