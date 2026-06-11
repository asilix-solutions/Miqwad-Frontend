import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { adminApi } from "../api/adminApi";
import type { AdminProviderStatus } from "../types";

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
