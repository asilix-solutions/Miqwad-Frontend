import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdminProvider, AdminProviderStatus, DashboardStats, AdminUserRow, AdminUserDetail, City, SubscriberType, RevenueSummary, RevenueSource } from "../types";
import type { ProviderType } from "@modules/providers/types";
import type { Service, ServiceCategory } from "@modules/services/types";

/**
 * Payload for creating a category.
 * The hierarchy fields (parentId, level, providerTypeScope, isActive, sortOrder)
 * are optional here so the Phase-2 admin form (which only knows nameAr/nameEn/colorHint)
 * continues to compile. Phase-3 will pass all fields.
 */
export type CreateCategoryPayload =
  Pick<ServiceCategory, "nameAr" | "nameEn" | "iconUrl" | "colorHint"> &
  Partial<Pick<ServiceCategory, "parentId" | "level" | "providerTypeScope" | "isActive" | "sortOrder">>;
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import type { SubscriptionPlan, ProviderSubscription } from "@modules/subscriptions/types";
import type { NotificationTemplate, SentNotification } from "@modules/notifications/types";
import type { AdPlacement, AdCampaign } from "@modules/ads/types";
import type { SystemSettings, SettingsSection } from "@modules/settings/types";
import type { AuditLogEntry, AuditLogQuery } from "@modules/audit/types";
import type { Complaint, ComplaintStatus, ComplaintsQuery } from "@modules/complaints/types";
import type { UserFormValues } from "../schemas/userSchema";

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

  getRevenues: async (params?: { source?: RevenueSource }): Promise<RevenueSummary> => {
    const { data } = await apiClient.get<RevenueSummary>("/admin/revenues", { params });
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

  // TODO: wire to backend — POST /admin/users (.NET). Single swap point for
  // the admin "Add User" flow; the `type` discriminator in the payload lets
  // the backend branch between client and provider-subtype registration.
  createUser: async (payload: UserFormValues): Promise<AdminUserRow> => {
    const { data } = await apiClient.post<AdminUserRow>("/admin/users", payload);
    return data;
  },

  listProviders: async (status?: AdminProviderStatus, type?: ProviderType): Promise<AdminProvider[]> => {
    const params: Record<string, string> = {};
    if (status && status !== "all") params.status = status;
    if (type) params.type = type;
    const { data } = await apiClient.get<AdminProvider[]>("/admin/providers", { 
      params: Object.keys(params).length > 0 ? params : undefined 
    });
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

  updateProviderCommission: async (providerId: number, commissionRate: number): Promise<AdminProvider> => {
    const { data } = await apiClient.patch<AdminProvider>(
      `/admin/providers/${providerId}/commission`,
      { commissionRate },
    );
    return data;
  },




  createCategory: async (payload: CreateCategoryPayload): Promise<ServiceCategory> => {
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

  patchCategoryActive: async (id: number, isActive: boolean): Promise<ServiceCategory> => {
    const { data } = await apiClient.patch<ServiceCategory>(`/admin/categories/${id}`, { isActive });
    return data;
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

  // ── Provider Subscriptions ──────────────────────────────────────────────────

  getSubscriptions: async (params: { page: number; pageSize: number; status?: string; type?: SubscriberType }): Promise<PaginatedResponse<ProviderSubscription>> => {
    const { data } = await apiClient.get<PaginatedResponse<ProviderSubscription>>("/admin/subscriptions", { params });
    return data;
  },

  cancelSubscription: async (id: number): Promise<ProviderSubscription> => {
    const { data } = await apiClient.post<ProviderSubscription>(`/admin/subscriptions/${id}/cancel`);
    return data;
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

  // ── Notifications ──────────────────────────────────────────────────────────

  getTemplates: async (params?: { isActive?: boolean }): Promise<NotificationTemplate[]> => {
    const { data } = await apiClient.get<NotificationTemplate[]>("/admin/notification-templates", { params });
    return data;
  },

  getTemplate: async (id: string): Promise<NotificationTemplate> => {
    const { data } = await apiClient.get<NotificationTemplate>(`/admin/notification-templates/${id}`);
    return data;
  },

  createTemplate: async (payload: Omit<NotificationTemplate, "id">): Promise<NotificationTemplate> => {
    const { data } = await apiClient.post<NotificationTemplate>("/admin/notification-templates", payload);
    return data;
  },

  updateTemplate: async (id: string, payload: Partial<NotificationTemplate>): Promise<NotificationTemplate> => {
    const { data } = await apiClient.put<NotificationTemplate>(`/admin/notification-templates/${id}`, payload);
    return data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/notification-templates/${id}`);
  },

  sendNotification: async (payload: Omit<SentNotification, "id" | "status" | "sentAt" | "recipientsCount">): Promise<SentNotification> => {
    const { data } = await apiClient.post<SentNotification>("/admin/notifications/send", payload);
    return data;
  },

  getSentNotifications: async (params: { page: number; pageSize: number; status?: string }): Promise<PaginatedResponse<SentNotification>> => {
    const { data } = await apiClient.get<PaginatedResponse<SentNotification>>("/admin/notifications", { params });
    return data;
  },

  // ── Ads (Campaigns & Placements) ───────────────────────────────────────────

  getPlacements: async (params?: { isActive?: boolean }): Promise<AdPlacement[]> => {
    const { data } = await apiClient.get<AdPlacement[]>("/admin/ad-placements", { params });
    return data;
  },

  createPlacement: async (payload: Omit<AdPlacement, "id">): Promise<AdPlacement> => {
    const { data } = await apiClient.post<AdPlacement>("/admin/ad-placements", payload);
    return data;
  },

  updatePlacement: async (id: number, payload: Partial<Omit<AdPlacement, "id">>): Promise<AdPlacement> => {
    const { data } = await apiClient.put<AdPlacement>(`/admin/ad-placements/${id}`, payload);
    return data;
  },

  deletePlacement: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/ad-placements/${id}`);
  },

  getCampaigns: async (params: { page: number; pageSize: number; status?: string; placementId?: number }): Promise<PaginatedResponse<AdCampaign>> => {
    const { data } = await apiClient.get<PaginatedResponse<AdCampaign>>("/admin/ad-campaigns", { params });
    return data;
  },

  getCampaign: async (id: number): Promise<AdCampaign> => {
    const { data } = await apiClient.get<AdCampaign>(`/admin/ad-campaigns/${id}`);
    return data;
  },

  createCampaign: async (payload: Omit<AdCampaign, "id" | "createdAt">): Promise<AdCampaign> => {
    const { data } = await apiClient.post<AdCampaign>("/admin/ad-campaigns", payload);
    return data;
  },

  updateCampaign: async (id: number, payload: Partial<Omit<AdCampaign, "id" | "createdAt">>): Promise<AdCampaign> => {
    const { data } = await apiClient.put<AdCampaign>(`/admin/ad-campaigns/${id}`, payload);
    return data;
  },

  deleteCampaign: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/ad-campaigns/${id}`);
  },

  // ── System Settings ────────────────────────────────────────────────────────

  getSettings: async (): Promise<SystemSettings> => {
    const { data } = await apiClient.get<SystemSettings>("/admin/settings");
    return data;
  },

  updateSettingsSection: async <T>(section: SettingsSection, payload: T): Promise<SystemSettings> => {
    const { data } = await apiClient.put<SystemSettings>(`/admin/settings/${section}`, payload);
    return data;
  },

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  getAuditLogs: async (params: AuditLogQuery): Promise<PaginatedResponse<AuditLogEntry>> => {
    const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>("/admin/audit-logs", { params });
    return data;
  },

  exportAuditLogs: async (params: Omit<AuditLogQuery, "page" | "pageSize">): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>("/admin/audit-logs/export", {
      params,
      responseType: "blob",
    });
    return data;
  },

  // ── Complaints ─────────────────────────────────────────────────────────────

  getComplaints: async (params: ComplaintsQuery): Promise<PaginatedResponse<Complaint>> => {
    const { data } = await apiClient.get<PaginatedResponse<Complaint>>("/admin/complaints", { params });
    return data;
  },

  updateComplaintStatus: async (id: string, status: ComplaintStatus): Promise<Complaint> => {
    const { data } = await apiClient.patch<Complaint>(`/admin/complaints/${id}/status`, { status });
    return data;
  },
};


