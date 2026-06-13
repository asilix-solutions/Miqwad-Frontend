import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import type { AdminProviderStatus, SettlementStatus, DisputeStatus, ResolveDecision, EscrowStatus } from "../types";
import { useServiceCategoriesQuery, servicesKeys } from "@modules/services/hooks/useServicesQueries";
import type { Service, ServiceCategory, ServicePackage } from "@modules/services/types";
import type { City } from "../types";
import { useBrandsQuery, useModelsQuery } from "@modules/vehicles/hooks/useBrandsModels";
import type { Brand, VehicleModel } from "@modules/vehicles/types";
import type { SubscriptionPlan } from "@modules/subscriptions/types";
import type { NotificationTemplate, SentNotification } from "@modules/notifications/types";
import type { AdPlacement, AdCampaign } from "@modules/ads/types";
import { useToast } from "@shared/components/ui/toastContext";
import { useTranslation } from "react-i18next";

/**
 * Admin queries + mutations.
 */
export const adminKeys = {
  all: ["admin"] as const,
  users: (params: { page: number; pageSize: number }) => [...adminKeys.all, "users", params] as const,
  providers: (status?: AdminProviderStatus) =>
    [...adminKeys.all, "providers", status ?? "all"] as const,
  dashboardStats: () => [...adminKeys.all, "dashboardStats"] as const,
  user: (id: string) => [...adminKeys.all, "user", id] as const,
  settlements: (params: { page: number; pageSize: number; status?: SettlementStatus }) => [...adminKeys.all, "settlements", params] as const,
  disputes: (params: { page: number; pageSize: number; status?: DisputeStatus | "all" }) => [...adminKeys.all, "disputes", params] as const,
  dispute: (id: string) => [...adminKeys.all, "dispute", id] as const,
  escrow: (params: { page: number; pageSize: number; status?: EscrowStatus | "all" }) => [...adminKeys.all, "escrow", params] as const,
  cities: () => [...adminKeys.all, "cities"] as const,
  services: (params?: { categoryId?: number; isActive?: boolean }) => [...adminKeys.all, "services", params] as const,
  packages: (params?: { isActive?: boolean }) => [...adminKeys.all, "packages", params] as const,
  package: (id: number) => [...adminKeys.all, "package", id] as const,
  plans: (params?: { isActive?: boolean }) => [...adminKeys.all, "plans", params] as const,
  plan: (id: number) => [...adminKeys.all, "plan", id] as const,
  subscriptions: (params: { page: number; pageSize: number; status?: string }) => [...adminKeys.all, "subscriptions", params] as const,
  templates: (params?: { isActive?: boolean }) => [...adminKeys.all, "templates", params] as const,
  template: (id: string) => [...adminKeys.all, "template", id] as const,
  notifications: (params: { page: number; pageSize: number; status?: string }) => [...adminKeys.all, "notifications", params] as const,
  placements: (params?: { isActive?: boolean }) => [...adminKeys.all, "placements", params] as const,
  placement: (id: number) => [...adminKeys.all, "placement", id] as const,
  campaigns: (params?: { status?: string; placementId?: number }) => [...adminKeys.all, "campaigns", params] as const,
  campaign: (id: number) => [...adminKeys.all, "campaign", id] as const,
};


export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: adminKeys.dashboardStats(),
    queryFn: () => adminApi.getDashboardStats(),
  });
}

export function useUsersQuery(params: { page: number; pageSize: number }) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProvidersQuery(status: AdminProviderStatus = "pending") {
  return useQuery({
    queryKey: adminKeys.providers(status),
    queryFn: () => adminApi.listProviders(status),
    placeholderData: keepPreviousData,
  });
}

export function useApproveProviderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: number) => adminApi.approveProvider(providerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useRejectProviderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { providerId: number; reason: string }) =>
      adminApi.rejectProvider(input.providerId, input.reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useUserQuery(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminApi.getUser(id),
  });
}

export function useSuspendUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; reason: string }) =>
      adminApi.suspendUser(input.userId, input.reason),
    onSuccess: (_, input) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "users"] });
      void qc.invalidateQueries({ queryKey: adminKeys.user(input.userId) });
    },
  });
}

export function useRestoreUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.restoreUser(userId),
    onSuccess: (_, userId) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "users"] });
      void qc.invalidateQueries({ queryKey: adminKeys.user(userId) });
    },
  });
}

export function useSettlementsQuery(params: { page: number; pageSize: number; status?: SettlementStatus }) {
  return useQuery({
    queryKey: adminKeys.settlements(params),
    queryFn: () => adminApi.getSettlements(params),
    placeholderData: keepPreviousData,
  });
}

export function useApproveSettlementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.approveSettlement(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "settlements"] });
    },
  });
}

export function useRejectSettlementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      adminApi.rejectSettlement(input.id, input.reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "settlements"] });
    },
  });
}

export function useDisputesQuery(params: { page: number; pageSize: number; status?: DisputeStatus | "all" }) {
  return useQuery({
    queryKey: adminKeys.disputes(params),
    queryFn: () => adminApi.getDisputes(params),
    placeholderData: keepPreviousData,
  });
}

export function useDisputeQuery(id: string) {
  return useQuery({
    queryKey: adminKeys.dispute(id),
    queryFn: () => adminApi.getDispute(id),
  });
}

export function useResolveDisputeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: { decision: ResolveDecision; note: string; partialAmount?: number } }) =>
      adminApi.resolveDispute(input.id, input.payload),
    onSuccess: (_, input) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "disputes"] });
      void qc.invalidateQueries({ queryKey: adminKeys.dispute(input.id) });
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "escrow"] });
    },
  });
}

export function useEscrowQuery(params: { page: number; pageSize: number; status?: EscrowStatus | "all" }) {
  return useQuery({
    queryKey: adminKeys.escrow(params),
    queryFn: () => adminApi.getEscrowTransactions(params),
    placeholderData: keepPreviousData,
  });
}

// ── Categories ─────────────────────────────────────────────────────────────

export function useAdminCategoriesQuery() {
  // We wrap the client query because the client GET /categories returns all 
  // categories which is exactly what the admin needs to list them.
  return useServiceCategoriesQuery();
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ServiceCategory, "id">) => adminApi.createCategory(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: servicesKeys.categories() });
    },
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServiceCategory> }) =>
      adminApi.updateCategory(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: servicesKeys.categories() });
    },
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: servicesKeys.categories() });
    },
  });
}

// ── Services ───────────────────────────────────────────────────────────────

export function useAdminServicesQuery(params?: { categoryId?: number; isActive?: boolean }) {
  return useQuery({
    queryKey: adminKeys.services(params),
    queryFn: () => adminApi.getServices(params),
  });
}

export function useCreateServiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Service, "id">) => adminApi.createService(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "services"] });
    },
  });
}

export function useUpdateServiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Service> }) =>
      adminApi.updateService(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "services"] });
    },
  });
}

export function useDeleteServiceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteService(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "services"] });
    },
  });
}

// ── Packages ───────────────────────────────────────────────────────────────

export function useAdminPackagesQuery(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: adminKeys.packages(params),
    queryFn: () => adminApi.getPackages(params),
  });
}

export function usePackageQuery(id: number) {
  return useQuery({
    queryKey: adminKeys.package(id),
    queryFn: () => adminApi.getPackage(id),
  });
}

export function useCreatePackageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ServicePackage, "id">) => adminApi.createPackage(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "packages"] });
    },
  });
}

export function useUpdatePackageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ServicePackage> }) =>
      adminApi.updatePackage(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "packages"] });
      void qc.invalidateQueries({ queryKey: adminKeys.package(variables.id) });
    },
  });
}

export function useDeletePackageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deletePackage(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "packages"] });
    },
  });
}

// ── Subscription Plans ─────────────────────────────────────────────────────

export function useAdminPlansQuery(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: adminKeys.plans(params),
    queryFn: () => adminApi.getPlans(params),
  });
}

export function usePlanQuery(id: number) {
  return useQuery({
    queryKey: adminKeys.plan(id),
    queryFn: () => adminApi.getPlan(id),
  });
}

export function useCreatePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<SubscriptionPlan, "id">) => adminApi.createPlan(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "plans"] });
    },
  });
}

export function useUpdatePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SubscriptionPlan> }) =>
      adminApi.updatePlan(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "plans"] });
      void qc.invalidateQueries({ queryKey: adminKeys.plan(variables.id) });
    },
  });
}

export function useDeletePlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deletePlan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "plans"] });
    },
  });
}

// ── Provider Subscriptions ──────────────────────────────────────────────────

export function useSubscriptionsQuery(params: { page: number; pageSize: number; status?: string }) {
  return useQuery({
    queryKey: adminKeys.subscriptions(params),
    queryFn: () => adminApi.getSubscriptions(params),
    placeholderData: keepPreviousData,
  });
}

export function useCancelSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.cancelSubscription(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "subscriptions"] });
    },
  });
}

// ── Cities ─────────────────────────────────────────────────────────────────

export function useCitiesQuery() {
  return useQuery({
    queryKey: adminKeys.cities(),
    queryFn: () => adminApi.getCities(),
  });
}

export function useCreateCityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<City, "id">) => adminApi.createCity(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.cities() });
    },
  });
}

export function useUpdateCityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<City> }) =>
      adminApi.updateCity(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.cities() });
    },
  });
}

export function useDeleteCityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCity(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.cities() });
    },
  });
}

// ── Vehicle Brands ──────────────────────────────────────────────────────────

export function useAdminBrandsQuery() {
  return useBrandsQuery();
}

export function useCreateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Brand, "id">) => adminApi.createBrand(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lookups", "brands"] });
    },
  });
}

export function useUpdateBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Brand> }) =>
      adminApi.updateBrand(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lookups", "brands"] });
    },
  });
}

export function useDeleteBrandMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteBrand(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["lookups", "brands"] });
    },
  });
}

// ── Vehicle Models ─────────────────────────────────────────────────────────

export function useModelsForBrandQuery(brandId: number | null) {
  return useModelsQuery(brandId);
}

export function useCreateModelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, payload }: { brandId: number; payload: Omit<VehicleModel, "id"> }) => 
      adminApi.createModel(brandId, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["lookups", "brands", variables.brandId, "models"] });
    },
  });
}

export function useUpdateModelMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, modelId, payload }: { brandId: number; modelId: number; payload: Partial<VehicleModel> }) =>
      adminApi.updateModel(brandId, modelId, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ["lookups", "brands", variables.brandId, "models"] });
    },
  });
}

  export function useDeleteModelMutation() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ brandId, modelId }: { brandId: number; modelId: number }) => adminApi.deleteModel(brandId, modelId),
      onSuccess: (_, variables) => {
        void qc.invalidateQueries({ queryKey: ["lookups", "brands", variables.brandId, "models"] });
      },
    });
  }

// ── Notifications ──────────────────────────────────────────────────────────

export function useTemplatesQuery(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: adminKeys.templates(params),
    queryFn: () => adminApi.getTemplates(params),
  });
}

export function useTemplateQuery(id: string) {
  return useQuery({
    queryKey: adminKeys.template(id),
    queryFn: () => adminApi.getTemplate(id),
  });
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: Omit<NotificationTemplate, "id">) => adminApi.createTemplate(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "templates"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useUpdateTemplateMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<NotificationTemplate> }) =>
      adminApi.updateTemplate(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "templates"] });
      void qc.invalidateQueries({ queryKey: adminKeys.template(variables.id) });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTemplate(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "templates"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useSendNotificationMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: Omit<SentNotification, "id" | "status" | "sentAt" | "recipientsCount">) => adminApi.sendNotification(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "notifications"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useSentNotificationsQuery(params: { page: number; pageSize: number; status?: string }) {
  return useQuery({
    queryKey: adminKeys.notifications(params),
    queryFn: () => adminApi.getSentNotifications(params),
    placeholderData: keepPreviousData,
  });
}

// ── Ads (Campaigns & Placements) ───────────────────────────────────────────

export function usePlacementsQuery(params?: { isActive?: boolean }) {
  return useQuery({
    queryKey: adminKeys.placements(params),
    queryFn: () => adminApi.getPlacements(params),
  });
}

export function useCreatePlacementMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: Omit<AdPlacement, "id">) => adminApi.createPlacement(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "placements"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useUpdatePlacementMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<AdPlacement, "id">> }) =>
      adminApi.updatePlacement(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "placements"] });
      void qc.invalidateQueries({ queryKey: adminKeys.placement(variables.id) });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useDeletePlacementMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => adminApi.deletePlacement(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "placements"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useCampaignsQuery(params: { page: number; pageSize: number; status?: string; placementId?: number }) {
  return useQuery({
    queryKey: adminKeys.campaigns(params),
    queryFn: () => adminApi.getCampaigns(params),
    placeholderData: keepPreviousData,
  });
}

export function useCampaignQuery(id: number, enabled = true) {
  return useQuery({
    queryKey: adminKeys.campaign(id),
    queryFn: () => adminApi.getCampaign(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useCreateCampaignMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: Omit<AdCampaign, "id" | "createdAt">) => adminApi.createCampaign(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "campaigns"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useUpdateCampaignMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<AdCampaign, "id" | "createdAt">> }) =>
      adminApi.updateCampaign(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "campaigns"] });
      void qc.invalidateQueries({ queryKey: adminKeys.campaign(variables.id) });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}

export function useDeleteCampaignMutation() {
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCampaign(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...adminKeys.all, "campaigns"] });
    },
    onError: () => {
      toast.error(t("common.saveFailed") || "Save failed");
    }
  });
}
