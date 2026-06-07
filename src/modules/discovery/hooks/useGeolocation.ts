import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  setGeolocationState,
  setOrigin,
  applyFallbackOrigin,
} from "../store/discoverySlice";

/**
 * Wrapper around the browser Geolocation API with safe fallbacks.
 *
 * Why a hook (and not a util):
 *  - we need to dispatch Redux actions to keep the UI in sync
 *  - the consumer can request location at any moment (button click)
 *  - cancellation isn't strictly necessary because the browser stops
 *    pending watches automatically on unmount via component lifecycle
 *
 * Permissions in the browser:
 *  - granted   → we call `getCurrentPosition` once and pin the origin
 *  - denied    → we surface the city picker (fallback)
 *  - prompt    → we wait until the user clicks "use my location"
 */
export function useGeolocation() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.discovery.geolocation);

  const request = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        dispatch(setGeolocationState("denied"));
        dispatch(applyFallbackOrigin());
        resolve(null);
        return;
      }
      dispatch(setGeolocationState("requesting"));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          dispatch(setGeolocationState("granted"));
          dispatch(setOrigin(coords));
          resolve(coords);
        },
        () => {
          // Denied or error: dispatch fallback so the page is usable.
          dispatch(setGeolocationState("denied"));
          dispatch(applyFallbackOrigin());
          resolve(null);
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
      );
    });
  }, [dispatch]);

  return { state, request };
}
