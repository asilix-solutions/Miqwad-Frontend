import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import type { AdminProviderStatus, SettlementStatus, DisputeStatus, ResolveDecision, EscrowStatus } from "../types";
import { useServiceCategoriesQuery, servicesKeys } from "@modules/services/hooks/useServicesQueries";
import type { ServiceCategory } from "@modules/services/types";
import type { City } from "../types";
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

