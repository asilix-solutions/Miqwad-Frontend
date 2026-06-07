import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "@modules/auth/store/authSlice";
import {
  DEFAULT_RADIUS_KM,
  FALLBACK_ORIGIN,
  type NearbySearchFilters,
  type PriceBand,
} from "../types";

/**
 * Discovery module slice — holds:
 *   - the current search filters (cached across navigations so a user
 *     can drill into a provider and come back to the same list state)
 *   - the resolved geolocation status (granted / denied / unknown)
 *
 * Favorites are stored as a Set<number> for O(1) lookup from cards
 * (using a plain `number[]` would require an indexOf per card).
 * RTK Toolkit is happy with `number[]` payloads — we project to a Set
 * via a selector in the hooks layer.
 */

export type GeolocationState = "unknown" | "requesting" | "granted" | "denied";

export type ViewMode = "list" | "map";

interface DiscoveryState {
  filters: NearbySearchFilters;
  geolocation: GeolocationState;
  viewMode: ViewMode;
  /** Local mirror of the favorites list so the heart button is instant. */
  favoriteIds: number[];
}

const initialState: DiscoveryState = {
  filters: {
    lat: null,
    lng: null,
    radiusKm: DEFAULT_RADIUS_KM,
    categoryId: null,
    minRating: 0,
    priceBand: null,
    openNowOnly: false,
    q: "",
  },
  geolocation: "unknown",
  viewMode: "list",
  favoriteIds: [],
};

const discoverySlice = createSlice({
  name: "discovery",
  initialState,
  reducers: {
    setOrigin(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.filters.lat = action.payload.lat;
      state.filters.lng = action.payload.lng;
    },
    applyFallbackOrigin(state) {
      state.filters.lat = FALLBACK_ORIGIN.lat;
      state.filters.lng = FALLBACK_ORIGIN.lng;
    },
    setGeolocationState(state, action: PayloadAction<GeolocationState>) {
      state.geolocation = action.payload;
    },
    setRadius(state, action: PayloadAction<number>) {
      state.filters.radiusKm = action.payload;
    },
    setCategory(state, action: PayloadAction<number | null>) {
      state.filters.categoryId = action.payload;
    },
    setMinRating(state, action: PayloadAction<NearbySearchFilters["minRating"]>) {
      state.filters.minRating = action.payload;
    },
    setPriceBand(state, action: PayloadAction<PriceBand | null>) {
      state.filters.priceBand = action.payload;
    },
    setOpenNowOnly(state, action: PayloadAction<boolean>) {
      state.filters.openNowOnly = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.filters.q = action.payload;
    },
    resetFilters(state) {
      const { lat, lng } = state.filters;
      state.filters = {
        ...initialState.filters,
        lat,
        lng,
      };
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    setFavorites(state, action: PayloadAction<number[]>) {
      state.favoriteIds = [...new Set(action.payload)];
    },
    addFavoriteLocal(state, action: PayloadAction<number>) {
      if (!state.favoriteIds.includes(action.payload)) {
        state.favoriteIds.push(action.payload);
      }
    },
    removeFavoriteLocal(state, action: PayloadAction<number>) {
      state.favoriteIds = state.favoriteIds.filter((id) => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    // Clear discovery state on logout so the next user starts fresh.
    builder.addCase(logout, () => initialState);
  },
});

export const {
  setOrigin,
  applyFallbackOrigin,
  setGeolocationState,
  setRadius,
  setCategory,
  setMinRating,
  setPriceBand,
  setOpenNowOnly,
  setQuery,
  resetFilters,
  setViewMode,
  setFavorites,
  addFavoriteLocal,
  removeFavoriteLocal,
} = discoverySlice.actions;

export default discoverySlice.reducer;
