import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "../api/vehiclesApi";
import { vehiclesKeys } from "./useVehiclesQuery";
import type {
  AddMaintenanceRecordRequest,
  CreateVehicleRequest,
  UpdateVehicleRequest,
} from "../types";

/**
 * Mutation hooks for the Vehicles module.
 *
 * Each hook is responsible for:
 *   1. Performing the network call.
 *   2. Invalidating the related caches so the UI reflects fresh data.
 *
 * Components stay declarative — they only `mutate({...})` and react
 * to `isPending` / `isError`. Side-effects (toasts, navigation) live
 * in the calling page so individual flows can compose differently.
 */

export function useCreateVehicleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVehicleRequest) => vehiclesApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
    },
  });
}

export function useUpdateVehicleMutation(vehicleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateVehicleRequest) => vehiclesApi.update(vehicleId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      void qc.invalidateQueries({ queryKey: vehiclesKeys.detail(vehicleId) });
    },
  });
}

export function useDeleteVehicleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => vehiclesApi.remove(id),
    onSuccess: (_void, id) => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      qc.removeQueries({ queryKey: vehiclesKeys.detail(id) });
      qc.removeQueries({ queryKey: vehiclesKeys.upcoming(id) });
    },
  });
}

export function useAddMaintenanceRecordMutation(vehicleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMaintenanceRecordRequest) =>
      vehiclesApi.addMaintenanceRecord(vehicleId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.maintenance(vehicleId) });
      // The list page shows last-service info per card; refresh it too.
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      void qc.invalidateQueries({ queryKey: vehiclesKeys.upcoming(vehicleId) });
    },
  });
}
