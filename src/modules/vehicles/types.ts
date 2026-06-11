/**
 * Vehicles domain types.
 *
 * Aligned with the .NET backend Swagger (`miquad-api.yaml`):
 *   GET    /Vehicles
 *   POST   /Vehicles
 *   GET    /Vehicles/{id}
 *   PUT    /Vehicles/{id}
 *   DELETE /Vehicles/{id}
 *   GET    /Vehicles/{id}/maintenance-history
 *   POST   /Vehicles/{id}/maintenance-history
 *   GET    /Vehicles/{id}/upcoming-services
 *   GET    /Lookups/brands
 *   GET    /Lookups/brands/{id}/models
 *   GET    /Lookups/brands/{id}/models/{modelId}/years
 *
 * Optional fields stay nullable so the UI can render
 * a clean "—" placeholder without runtime checks everywhere.
 */

export type FuelType = "gasoline" | "diesel" | "hybrid" | "electric";

export interface Brand {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
}

export interface VehicleModel {
  id: number;
  name: string;
  nameAr: string;
  nameEn: string;
}

export interface Vehicle {
  id: number;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  year: number;
  plateNumber: string;
  color: string | null;
  mileage: number | null;
  vin: string | null;
  registrationDate: string | null; // ISO date (YYYY-MM-DD)
  fuelType: FuelType | null;
  nickname: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface CreateVehicleRequest {
  brandId: number;
  modelId: number;
  year: number;
  plateNumber: string;
  color?: string;
  mileage?: number;
  vin?: string;
  registrationDate?: string;
  fuelType?: FuelType;
  nickname?: string;
  imageUrl?: string;
}

export type UpdateVehicleRequest = CreateVehicleRequest;

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  serviceName: string;
  providerName: string | null;
  date: string; // ISO date
  mileage: number | null;
  cost: number | null;
  notes: string | null;
}

export interface AddMaintenanceRecordRequest {
  serviceName: string;
  providerName?: string;
  date: string;
  mileage?: number;
  cost?: number;
  notes?: string;
}

export interface UpcomingService {
  id: number;
  vehicleId: number;
  serviceName: string;
  dueDate: string | null;
  dueMileage: number | null;
  daysRemaining: number | null;
  /** "ok" | "soon" | "overdue" — derived on the server when available. */
  urgency: "ok" | "soon" | "overdue";
}

export interface MaintenanceHistoryQuery {
  vehicleId: number;
  limit?: number;
  offset?: number;
}
