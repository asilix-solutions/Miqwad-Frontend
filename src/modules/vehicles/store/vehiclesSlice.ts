import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Sprint 2 Vehicles slice.
 *
 * Scope is intentionally minimal — the *server* state (the list of
 * vehicles, brands, models, maintenance records) lives in TanStack
 * Query so we get cache, refetch and dedup for free.
 *
 * What we keep in Redux is the *UI* state that needs to survive
 * route changes:
 *   - lastSelectedVehicleId: convenient to highlight the "current"
 *     vehicle in cross-module dashboards (Sprint 3+).
 *   - listFilters: search / fuel-type filters on the list page so
 *     navigating to details then back preserves what the user typed.
 *
 * On logout we reset the entire slice (handled by `extraReducers`)
 * so no per-user state leaks across sessions.
 */

import { logout } from "@modules/auth/store/authSlice";

export interface VehiclesListFilters {
  search: string;
  fuelType: "" | "gasoline" | "diesel" | "hybrid" | "electric";
}

interface VehiclesState {
  lastSelectedVehicleId: number | null;
  listFilters: VehiclesListFilters;
}

const initialState: VehiclesState = {
  lastSelectedVehicleId: null,
  listFilters: { search: "", fuelType: "" },
};

const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    setSelectedVehicle(state, action: PayloadAction<number | null>) {
      state.lastSelectedVehicleId = action.payload;
    },
    setListFilters(state, action: PayloadAction<Partial<VehiclesListFilters>>) {
      state.listFilters = { ...state.listFilters, ...action.payload };
    },
    resetListFilters(state) {
      state.listFilters = initialState.listFilters;
    },
  },
  extraReducers: (builder) => {
    // Cross-slice cleanup: dropping auth must clear all derived state.
    builder.addCase(logout, () => initialState);
  },
});

export const { setSelectedVehicle, setListFilters, resetListFilters } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;
