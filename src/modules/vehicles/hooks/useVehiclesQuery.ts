import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "../api/vehiclesApi";

/**
 * Read-side queries for the Vehicles module.
 * Mutations live in `useVehicleMutations` for clarity.
 *
 * Query keys are exported so consumers (mutations, optimistic updates,
 * cross-feature invalidation) reference a single source of truth.
 */

export const vehiclesKeys = {
  all: ["vehicles"] as const,
  list: () => [...vehiclesKeys.all, "list"] as const,
  detail: (id: number) => [...vehiclesKeys.all, "detail", id] as const,
  maintenance: (id: number, page?: number) =>
    [...vehiclesKeys.all, "maintenance", id, page ?? 0] as const,
  upcoming: (id: number) => [...vehiclesKeys.all, "upcoming", id] as const,
};

export function useVehiclesListQuery() {
  return useQuery({
    queryKey: vehiclesKeys.list(),
    queryFn: () => vehiclesApi.list(),
  });
}

export function useVehicleQuery(id: number | null) {
  return useQuery({
    queryKey: id ? vehiclesKeys.detail(id) : ["vehicles", "detail", "noop"],
    queryFn: () => vehiclesApi.byId(id!),
    enabled: id != null && id > 0,
  });
}

export function useMaintenanceHistoryQuery(
  vehicleId: number | null,
  page = 0,
  pageSize = 20,
) {
  return useQuery({
    queryKey: vehicleId
      ? vehiclesKeys.maintenance(vehicleId, page)
      : ["vehicles", "maintenance", "noop"],
    queryFn: () =>
      vehiclesApi.maintenanceHistory({
        vehicleId: vehicleId!,
        limit: pageSize,
        offset: page * pageSize,
      }),
    enabled: vehicleId != null && vehicleId > 0,
  });
}

export function useUpcomingServicesQuery(vehicleId: number | null) {
  return useQuery({
    queryKey: vehicleId ? vehiclesKeys.upcoming(vehicleId) : ["vehicles", "upcoming", "noop"],
    queryFn: () => vehiclesApi.upcomingServices(vehicleId!),
    enabled: vehicleId != null && vehicleId > 0,
  });
}
