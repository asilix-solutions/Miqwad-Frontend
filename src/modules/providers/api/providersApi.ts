import { apiClient } from "@shared/lib/axios";
import type {
  CreateProviderServiceRequest,
  ProviderDocument,
  ProviderProfile,
  ProviderService,
  RegisterProviderRequest,
  UpdateProviderServiceRequest,
} from "../types";

/**
 * Transport layer for the Providers endpoints (Sprint 3).
 *
 * Maps to the .NET Swagger contract:
 *   POST   /ServiceProviders/register
 *   GET    /ServiceProviders/{id}/profile
 *   POST   /ServiceProviders/{id}/documents       (BE-side TBD, mocked)
 *   GET    /providers/{providerId}/services
 *   POST   /providers/{providerId}/services
 *   PUT    /providers/{providerId}/services/{id}  (BE-side TBD, mocked)
 *   DELETE /providers/{providerId}/services/{id}  (BE-side TBD, mocked)
 */
export const providersApi = {
  // ---- Registration / profile ---------------------------------------------
  register: async (payload: RegisterProviderRequest): Promise<ProviderProfile> => {
    const { data } = await apiClient.post<ProviderProfile>(
      "/ServiceProviders/register",
      payload,
    );
    return data;
  },

  profile: async (providerId: number): Promise<ProviderProfile> => {
    const { data } = await apiClient.get<ProviderProfile>(
      `/ServiceProviders/${providerId}/profile`,
    );
    return data;
  },

  uploadDocuments: async (
    providerId: number,
    documents: ProviderDocument[],
  ): Promise<ProviderProfile> => {
    const { data } = await apiClient.post<ProviderProfile>(
      `/ServiceProviders/${providerId}/documents`,
      { documents },
    );
    return data;
  },

  // ---- Provider's services -------------------------------------------------
  listServices: async (providerId: number): Promise<ProviderService[]> => {
    const { data } = await apiClient.get<ProviderService[]>(
      `/providers/${providerId}/services`,
    );
    return data;
  },

  addService: async (
    providerId: number,
    payload: CreateProviderServiceRequest,
  ): Promise<ProviderService> => {
    const { data } = await apiClient.post<ProviderService>(
      `/providers/${providerId}/services`,
      payload,
    );
    return data;
  },

  updateService: async (
    providerId: number,
    serviceId: number,
    payload: UpdateProviderServiceRequest,
  ): Promise<ProviderService> => {
    const { data } = await apiClient.put<ProviderService>(
      `/providers/${providerId}/services/${serviceId}`,
      payload,
    );
    return data;
  },

  removeService: async (providerId: number, serviceId: number): Promise<void> => {
    await apiClient.delete(`/providers/${providerId}/services/${serviceId}`);
  },
};
