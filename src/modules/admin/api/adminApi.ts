import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdminProvider, AdminProviderStatus, DashboardStats, AdminUserRow } from "../types";

/**
 * Admin transport layer.
 *
 * Endpoints are not yet in the Swagger but documented in the MVP plan;
 * mocked locally until the backend exposes them. Swap by flipping
 * `VITE_USE_MOCKS=false`.
 */
export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>("/admin/dashboard/stats");
    return data;
  },

  getUsers: async (params: { page: number; pageSize: number }): Promise<PaginatedResponse<AdminUserRow>> => {
    const { data } = await apiClient.get<PaginatedResponse<AdminUserRow>>("/admin/users", { params });
    return data;
  },

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

