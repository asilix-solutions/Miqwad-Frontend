import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdminProvider, AdminProviderStatus, DashboardStats, AdminUserRow, AdminUserDetail, City, SubscriberType, RevenueSummary, RevenueSource } from "../types";
import type { ProviderType } from "@modules/providers/types";
import type { PricedService, ServiceCategory } from "@modules/services/types";

/**
 * Payload for creating a category.
 * The hierarchy fields (parentId, level, providerTypeScope, isActive, sortOrder)
 * are optional here so the Phase-2 admin form (which only knows nameAr/nameEn/colorHint)
 * continues to compile. Phase-3 will pass all fields.
 */
export type CreateCategoryPayload =
  Pick<ServiceCategory, "nameAr" | "nameEn" | "iconUrl" | "colorHint"> &
  Partial<Pick<ServiceCategory, "parentId" | "level" | "providerTypeScope" | "isActive" | "sortOrder">>;
import type { SubscriptionPlan, ProviderSubscription } from "@modules/subscriptions/types";
import type { NotificationTemplate, SentNotification } from "@modules/notifications/types";
import type { AdPlacement, AdCampaign } from "@modules/ads/types";
import type { SystemSettings, SettingsSection } from "@modules/settings/types";
import type { AuditLogEntry, AuditLogQuery } from "@modules/audit/types";
import type { Complaint, ComplaintStatus, ComplaintsQuery } from "@modules/complaints/types";
import type { UserFormValues } from "../schemas/userSchema";
import { unwrapEnvelope } from "@modules/auth/api/auth.adapter";
import { isAdminRole } from "../config/roleRegistry";
import { adaptAuditLogsResponse, type RawAuditLogPage } from "./audit.adapter";

/**
 * Server-sortable fields on `GET /api/Users` (verified live, casing matters).
 * `isActive` is accepted (200, no error) but its actual ordering could not be
 * visually confirmed against real data — the test dataset only had active
 * users.
 */
export type UsersSortField = "fullName" | "createdAt" | "isActive";

/** Raw `GET /api/Users` / `GET /api/Users/{id}` record — verbatim backend field names. */
interface RawAdminUser {
  id: string | number;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  address: string | null;
  city: string | null;
  idenityNumber: string | null;
  isActive: boolean;
  createdAt: string;
  roleId?: number;
}

interface RawUsersListData {
  items: RawAdminUser[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

function adaptUser(raw: RawAdminUser): AdminUserRow {
  return {
    id: String(raw.id),
    fullName: raw.fullName,
    email: raw.email ?? null,
    phoneNumber: raw.phoneNumber,
    address: raw.address ?? null,
    city: raw.city ?? null,
    idenityNumber: raw.idenityNumber ?? null,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    // Wire key is `roleId`; the app model exposes it as `role` for
    // roleRegistry compatibility (see config/roleRegistry.ts).
    role: typeof raw.roleId === "number" ? raw.roleId : undefined,
  };
}

/**
 * Unwraps the envelope, maps every row, and by default excludes admin
 * accounts (role === 1, resolved via roleRegistry's isAdminRole). Pass
 * `includeAdmins: true` for consumers that resolve names for any owner
 * (e.g. address owner lookups), where hiding admins would break resolution.
 */
function adaptUserList(raw: unknown, includeAdmins = false): PaginatedResponse<AdminUserRow> {
  const data = unwrapEnvelope<RawUsersListData>(raw);
  const items = data.items.map(adaptUser).filter((user) => includeAdmins || !isAdminRole(user.role));
  return {
    items,
    page: data.pageNumber,
    pageSize: data.pageSize,
    total: data.totalCount,
    totalPages: data.totalPages,
  };
}

/**
 * Payload for the dedicated, elevated-privilege "Add Admin" action.
 * No password — the backend emails the new admin an activation OTP and
 * they set their own password via the existing reset-password flow.
 */
export interface AdminCreateRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  role: 1;
}

/** Shape of the `data` field inside the backend's create-admin envelope. */
export interface AdminCreateResponseData {
  id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  [key: string]: unknown;
}

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


  // Bare `/Users` (no `admin/` prefix) bypasses the always-mocked bridge and
  // hits the real .NET backend — same pattern as createAdmin below.
  // NOTE: `FilterBy` accepts exactly ONE field (verified live: sending two
  // FilterBy/FilterValue pairs silently drops the second one). Role tab,
  // status filter and search are therefore mutually exclusive server-side —
  // the UI (UsersPanel) enforces that only one is ever set at a time, and
  // this precedence order (roleId > isActive > search) is a defensive
  // fallback, not something the UI should ever actually rely on.
  // `isActive` must be sent as the literal string "true"/"false" — "1"/"0"
  // returns a 400 ("was not recognized as a valid Boolean").
  // `SortBy`/`SortDescending` are independent of FilterBy and verified to
  // work alongside any single filter above.
  getUsers: async (params: {
    page: number;
    pageSize: number;
    search?: string;
    roleId?: number;
    isActive?: boolean;
    sortBy?: UsersSortField;
    sortDescending?: boolean;
    includeAdmins?: boolean;
  }): Promise<PaginatedResponse<AdminUserRow>> => {
    const filter = params.roleId !== undefined
      ? { FilterBy: "roleId", FilterValue: params.roleId }
      : params.isActive !== undefined
        ? { FilterBy: "isActive", FilterValue: params.isActive ? "true" : "false" }
        : params.search
          ? { FilterBy: "fullName", FilterValue: params.search }
          : {};
    const sort = params.sortBy
      ? { SortBy: params.sortBy, SortDescending: !!params.sortDescending }
      : {};
    const { data } = await apiClient.get("/Users", {
      params: {
        PageNumber: params.page,
        PageSize: params.pageSize,
        ...filter,
        ...sort,
      },
    });
    return adaptUserList(data, params.includeAdmins);
  },

  getUser: async (id: string): Promise<AdminUserDetail> => {
    const { data } = await apiClient.get(`/Users/${id}`);
    return adaptUser(unwrapEnvelope<RawAdminUser>(data));
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

  // SECURITY: admin-only creation must be enforced server-side ([Authorize]
  // on POST /api/Users). The frontend attaches the current admin's bearer
  // token via apiClient's request interceptor but cannot secure this
  // endpoint alone — server-side role authorization is the real gate.
  createAdmin: async (payload: AdminCreateRequest): Promise<AdminCreateResponseData> => {
    const { data } = await apiClient.post("/Users", payload);
    return unwrapEnvelope<AdminCreateResponseData>(data);
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

  getServices: async (params?: { categoryId?: number; isActive?: boolean }): Promise<PricedService[]> => {
    const { data } = await apiClient.get<PricedService[]>("/admin/services", { params });
    return data;
  },

  createService: async (payload: Omit<PricedService, "id">): Promise<PricedService> => {
    const { data } = await apiClient.post<PricedService>("/admin/services", payload);
    return data;
  },

  updateService: async (id: number, payload: Partial<PricedService>): Promise<PricedService> => {
    const { data } = await apiClient.put<PricedService>(`/admin/services/${id}`, payload);
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

  // Vehicle Brands/Models moved off the mocked `/admin/brands...` endpoint —
  // see `@modules/vehicles/api/brandsApi.ts` (real `/api/Brands`) and
  // `@modules/admin/hooks/useAdminQueries.ts` for the brand/model mutations.

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
  // Real endpoint is GET /api/auditlogs (only PageNumber/PageSize/SortBy/
  // SortDescending/FilterBy/FilterValue exist server-side) — module/action/
  // date/search filtering happens client-side in audit.adapter.ts. There is
  // no export endpoint; CSV export is generated client-side from the
  // currently-loaded page in AdminAuditLogPage.

  getAuditLogs: async (params: AuditLogQuery): Promise<PaginatedResponse<AuditLogEntry>> => {
    const { data } = await apiClient.get("/auditlogs", {
      params: {
        PageNumber: params.page,
        PageSize: params.pageSize,
        SortBy: "CreatedAt",
        SortDescending: true,
      },
    });
    return adaptAuditLogsResponse(unwrapEnvelope<RawAuditLogPage>(data), params);
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


