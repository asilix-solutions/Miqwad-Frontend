import { apiClient } from "@shared/lib/axios";
import type {
  AddMaintenanceRecordRequest,
  Brand,
  CreateVehicleRequest,
  MaintenanceHistoryQuery,
  MaintenanceRecord,
  UpcomingService,
  UpdateVehicleRequest,
  Vehicle,
  VehicleModel,
} from "../types";

/**
 * Thin Axios transport layer for the Vehicles + Lookups endpoints.
 * Keep functions one-liners; all business logic belongs in hooks.
 *
 * Endpoints follow the .NET Swagger contract. Until the backend
 * exposes them, the in-process mock adapter (`@shared/mocks`)
 * intercepts these calls in dev.
 */

export const vehiclesApi = {
  // ---- Vehicles -----------------------------------------------------------
  list: async (): Promise<Vehicle[]> => {
    const { data } = await apiClient.get<Vehicle[]>("/Vehicles");
    return data;
  },

  byId: async (id: number): Promise<Vehicle> => {
    const { data } = await apiClient.get<Vehicle>(`/Vehicles/${id}`);
    return data;
  },

  create: async (payload: CreateVehicleRequest): Promise<Vehicle> => {
    const { data } = await apiClient.post<Vehicle>("/Vehicles", payload);
    return data;
  },

  update: async (id: number, payload: UpdateVehicleRequest): Promise<Vehicle> => {
    const { data } = await apiClient.put<Vehicle>(`/Vehicles/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/Vehicles/${id}`);
  },

  // ---- Maintenance --------------------------------------------------------
  maintenanceHistory: async ({
    vehicleId,
    limit = 20,
    offset = 0,
  }: MaintenanceHistoryQuery): Promise<MaintenanceRecord[]> => {
    const { data } = await apiClient.get<MaintenanceRecord[]>(
      `/Vehicles/${vehicleId}/maintenance-history`,
      { params: { limit, offset } },
    );
    return data;
  },

  addMaintenanceRecord: async (
    vehicleId: number,
    payload: AddMaintenanceRecordRequest,
  ): Promise<MaintenanceRecord> => {
    const { data } = await apiClient.post<MaintenanceRecord>(
      `/Vehicles/${vehicleId}/maintenance-history`,
      payload,
    );
    return data;
  },

  upcomingServices: async (vehicleId: number): Promise<UpcomingService[]> => {
    const { data } = await apiClient.get<UpcomingService[]>(
      `/Vehicles/${vehicleId}/upcoming-services`,
    );
    return data;
  },

  // ---- Lookups ------------------------------------------------------------
  brands: async (): Promise<Brand[]> => {
    const { data } = await apiClient.get<Brand[]>("/Lookups/brands");
    return data;
  },

  modelsByBrand: async (brandId: number): Promise<VehicleModel[]> => {
    const { data } = await apiClient.get<VehicleModel[]>(
      `/Lookups/brands/${brandId}/models`,
    );
    return data;
  },

  yearsByModel: async (brandId: number, modelId: number): Promise<number[]> => {
    const { data } = await apiClient.get<number[]>(
      `/Lookups/brands/${brandId}/models/${modelId}/years`,
    );
    return data;
  },
};
