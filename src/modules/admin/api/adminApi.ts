import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdminProvider, AdminProviderStatus, DashboardStats, AdminUserRow, AdminUserDetail, SettlementRecord, SettlementStatus, DisputeRecord, DisputeDetail, EscrowTransaction, ResolveDecision, DisputeStatus, EscrowStatus, City } from "../types";
import type { Service, ServiceCategory, ServicePackage } from "@modules/services/types";
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import type { SubscriptionPlan } from "@modules/subscriptions/types";

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

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const { data } = await apiClient.get<AdminUserDetail>(`/admin/users/${id}`);
    return data;
  },

  suspendUser: async (id: string, reason: string): Promise<AdminUserRow> => {
    const { data } = await apiClient.post<AdminUserRow>(`/admin/users/${id}/suspend`, { reason });
    return data;
  },

  restoreUser: async (id: string): Promise<AdminUserRow> => {
    const { data } = await apiClient.post<AdminUserRow>(`/admin/users/${id}/restore`);
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

  getSettlements: async (params: { page: number; pageSize: number; status?: SettlementStatus }): Promise<PaginatedResponse<SettlementRecord>> => {
    const { data } = await apiClient.get<PaginatedResponse<SettlementRecord>>("/admin/settlements", { params });
    return data;
  },

  approveSettlement: async (id: string): Promise<SettlementRecord> => {
    const { data } = await apiClient.post<SettlementRecord>(`/admin/settlements/${id}/approve`);
    return data;
  },

  rejectSettlement: async (id: string, reason: string): Promise<SettlementRecord> => {
    const { data } = await apiClient.post<SettlementRecord>(`/admin/settlements/${id}/reject`, { reason });
    return data;
  },

  getDisputes: async (params: { page: number; pageSize: number; status?: DisputeStatus | "all" }): Promise<PaginatedResponse<DisputeRecord>> => {
    const { data } = await apiClient.get<PaginatedResponse<DisputeRecord>>("/admin/disputes", { params });
    return data;
  },

  getDispute: async (id: string): Promise<DisputeDetail> => {
    const { data } = await apiClient.get<DisputeDetail>(`/admin/disputes/${id}`);
    return data;
  },

  resolveDispute: async (id: string, payload: { decision: ResolveDecision; note: string; partialAmount?: number }): Promise<DisputeDetail> => {
    const { data } = await apiClient.post<DisputeDetail>(`/admin/disputes/${id}/resolve`, payload);
    return data;
  },

  getEscrowTransactions: async (params: { page: number; pageSize: number; status?: EscrowStatus | "all" }): Promise<PaginatedResponse<EscrowTransaction>> => {
    const { data } = await apiClient.get<PaginatedResponse<EscrowTransaction>>("/admin/escrow", { params });
    return data;
  },

  createCategory: async (payload: Omit<ServiceCategory, "id">): Promise<ServiceCategory> => {
    const { data } = await apiClient.post<ServiceCategory>("/admin/categories", payload);
    return data;
  },

  updateCategory: async (id: number, payload: Partial<ServiceCategory>): Promise<ServiceCategory> => {
    const { data } = await apiClient.put<ServiceCategory>(`/admin/categories/${id}`, payload);
    return data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  // ── Services ─────────────────────────────────────────────────────────────

  getServices: async (params?: { categoryId?: number; isActive?: boolean }): Promise<Service[]> => {
    const { data } = await apiClient.get<Service[]>("/admin/services", { params });
    return data;
  },

  createService: async (payload: Omit<Service, "id">): Promise<Service> => {
    const { data } = await apiClient.post<Service>("/admin/services", payload);
    return data;
  },

  updateService: async (id: number, payload: Partial<Service>): Promise<Service> => {
    const { data } = await apiClient.put<Service>(`/admin/services/${id}`, payload);
    return data;
  },

  deleteService: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/services/${id}`);
  },

  // ── Packages ───────────────────────────────────────────────────────────────

  getPackages: async (params?: { isActive?: boolean }): Promise<ServicePackage[]> => {
    const { data } = await apiClient.get<ServicePackage[]>("/admin/packages", { params });
    return data;
  },

  getPackage: async (id: number): Promise<ServicePackage> => {
    const { data } = await apiClient.get<ServicePackage>(`/admin/packages/${id}`);
    return data;
  },

  createPackage: async (payload: Omit<ServicePackage, "id">): Promise<ServicePackage> => {
    const { data } = await apiClient.post<ServicePackage>("/admin/packages", payload);
    return data;
  },

  updatePackage: async (id: number, payload: Partial<ServicePackage>): Promise<ServicePackage> => {
    const { data } = await apiClient.put<ServicePackage>(`/admin/packages/${id}`, payload);
    return data;
  },

  deletePackage: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/packages/${id}`);
  },

  // ── Subscription Plans ─────────────────────────────────────────────────────

  getPlans: async (params?: { isActive?: boolean }): Promise<SubscriptionPlan[]> => {
    const { data } = await apiClient.get<SubscriptionPlan[]>("/admin/plans", { params });
    return data;
  },

  getPlan: async (id: number): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.get<SubscriptionPlan>(`/admin/plans/${id}`);
    return data;
  },

  createPlan: async (payload: Omit<SubscriptionPlan, "id">): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.post<SubscriptionPlan>("/admin/plans", payload);
    return data;
  },

  updatePlan: async (id: number, payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.put<SubscriptionPlan>(`/admin/plans/${id}`, payload);
    return data;
  },

  deletePlan: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/plans/${id}`);
  },

  getCities: async (): Promise<City[]> => {
    const { data } = await apiClient.get<City[]>("/admin/cities");
    return data;
  },

  createCity: async (payload: Omit<City, "id">): Promise<City> => {
    const { data } = await apiClient.post<City>("/admin/cities", payload);
    return data;
  },

  updateCity: async (id: string, payload: Partial<City>): Promise<City> => {
    const { data } = await apiClient.put<City>(`/admin/cities/${id}`, payload);
    return data;
  },

  deleteCity: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/cities/${id}`);
  },

  // ── Vehicle Brands ─────────────────────────────────────────────────────────

  createBrand: async (payload: Omit<Brand, "id" | "name">): Promise<Brand> => {
    const { data } = await apiClient.post<Brand>("/admin/brands", payload);
    return data;
  },

  updateBrand: async (id: number, payload: Partial<Omit<Brand, "id" | "name">>): Promise<Brand> => {
    const { data } = await apiClient.put<Brand>(`/admin/brands/${id}`, payload);
    return data;
  },

  deleteBrand: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/brands/${id}`);
  },

  // ── Vehicle Models ─────────────────────────────────────────────────────────

  createModel: async (brandId: number, payload: Omit<VehicleModel, "id" | "name">): Promise<VehicleModel> => {
    const { data } = await apiClient.post<VehicleModel>(`/admin/brands/${brandId}/models`, payload);
    return data;
  },

  updateModel: async (brandId: number, modelId: number, payload: Partial<Omit<VehicleModel, "id" | "name">>): Promise<VehicleModel> => {
    const { data } = await apiClient.put<VehicleModel>(`/admin/brands/${brandId}/models/${modelId}`, payload);
    return data;
  },

  deleteModel: async (brandId: number, modelId: number): Promise<void> => {
    await apiClient.delete(`/admin/brands/${brandId}/models/${modelId}`);
  },
};


