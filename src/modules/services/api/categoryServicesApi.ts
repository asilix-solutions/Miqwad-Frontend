/**
 * @file categoryServicesApi.ts
 * @description Transport layer for the real category↔service many-to-many
 * assignment endpoints (`/api/Categories/{id}/services*`), managed
 * category-side. Ready in Swagger now — unlike `serviceApi.ts`'s
 * `/api/Services` CRUD, these calls always hit the real backend, no mock
 * flag.
 */
import { apiClient } from "@shared/lib/axios";
import type { RawService, Service } from "@modules/services/service.types";
import { adaptRawService } from "../lib/serviceAdapter";
import type { ApiEnvelope } from "../lib/categoryAdapter";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

export const categoryServicesApi = {
  listForCategory: async (categoryId: number): Promise<Service[]> => {
    const { data } = await apiClient.get<ApiEnvelope<RawService[]>>(`/Categories/${categoryId}/services`);
    return unwrap(data).map(adaptRawService);
  },

  assign: async (categoryId: number, serviceId: number): Promise<void> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      `/Categories/${categoryId}/services/${serviceId}`,
    );
    if (!data.success) throw new Error(data.message || "Request failed");
  },

  unassign: async (categoryId: number, serviceId: number): Promise<void> => {
    const { data } = await apiClient.delete<ApiEnvelope<unknown>>(
      `/Categories/${categoryId}/services/${serviceId}`,
    );
    if (!data.success) throw new Error(data.message || "Request failed");
  },
};
