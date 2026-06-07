import { apiClient } from "@shared/lib/axios";
import type { AdminProvider, AdminProviderStatus } from "../types";

/**
 * Admin transport layer.
 *
 * Endpoints are not yet in the Swagger but documented in the MVP plan;
 * mocked locally until the backend exposes them. Swap by flipping
 * `VITE_USE_MOCKS=false`.
 */
export const adminApi = {
  listProviders: async (status?: AdminProviderStatus): Promise<AdminProvider[]> => {
    const params = status && status !== "all" ? { status } : undefined;
    const { data } = await apiClient.get<AdminProvider[]>("/admin/providers", { params });
    return data;
  },

  approveProvider: async (providerId: number): Promise<AdminProvider> => {
    const { data } = await apiClient.patch<AdminProvider>(
      `/admin/providers/${providerId}/approve`,
    );
    return data;
  },

  rejectProvider: async (providerId: number, reason: string): Promise<AdminProvider> => {
    const { data } = await apiClient.patch<AdminProvider>(
      `/admin/providers/${providerId}/reject`,
      { reason },
    );
    return data;
  },
};
