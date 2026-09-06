/**
 * @file useSubscriptionQueries.ts
 * @description TanStack Query key-factory + hooks for the admin Subscriptions
 * section (Subscription Plans + Provider Subscriptions). Server-state only —
 * no Redux slice. Hooks are silent (no toasts; UI shows feedback).
 *
 * Plans: read + create + update + activate/deactivate. There is NO delete
 * (no backend endpoint). Provider subscriptions: READ ONLY (no cancel/update
 * endpoint exists on the backend).
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryKey,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@shared/types/api";
import { subscriptionsApi, type SubscriptionListParams } from "../api/subscriptionsApi";
import type { SubscriptionPlan, SubscriptionPlanWritePayload } from "../types";

export const subscriptionKeys = {
  all: ["subscriptions"] as const,

  plans: () => [...subscriptionKeys.all, "plans"] as const,
  planList: (params: SubscriptionListParams = {}) =>
    [...subscriptionKeys.plans(), "list", params] as const,
  plan: (id: number) => [...subscriptionKeys.plans(), "detail", id] as const,

  providerSubscriptions: () =>
    [...subscriptionKeys.all, "providerSubscriptions"] as const,
  providerSubscriptionList: (params: SubscriptionListParams = {}) =>
    [...subscriptionKeys.providerSubscriptions(), "list", params] as const,
  providerSubscription: (id: number) =>
    [...subscriptionKeys.providerSubscriptions(), "detail", id] as const,
};

// ── Subscription Plans ──────────────────────────────────────────────────────

export function useSubscriptionPlans(params: SubscriptionListParams = {}) {
  return useQuery({
    queryKey: subscriptionKeys.planList(params),
    queryFn: () => subscriptionsApi.listPlans(params),
    placeholderData: keepPreviousData,
  });
}

export function useSubscriptionPlan(id: number) {
  return useQuery({
    queryKey: subscriptionKeys.plan(id),
    queryFn: () => subscriptionsApi.getPlan(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubscriptionPlanWritePayload) => subscriptionsApi.createPlan(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plans() });
    },
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SubscriptionPlanWritePayload }) =>
      subscriptionsApi.updatePlan(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plans() });
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plan(id) });
    },
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subscriptionsApi.activatePlan(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plans() });
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plan(id) });
    },
  });
}

export function useDeactivatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => subscriptionsApi.deactivatePlan(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plans() });
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plan(id) });
    },
  });
}

interface TogglePlanActiveVars {
  id: number;
  /** Target state after the toggle. */
  isActive: boolean;
}

interface TogglePlanActiveContext {
  previous: [QueryKey, PaginatedResponse<SubscriptionPlan> | undefined][];
}

/**
 * Optimistic activate/deactivate toggle for a plan's `isActive` flag. Calls
 * the dedicated PATCH `/activate` | `/deactivate` route (never PUT), flips the
 * flag across every cached plan list immediately, and rolls every affected
 * cache entry back on failure. UI owns the toast.
 */
export function useTogglePlanActive() {
  const qc = useQueryClient();
  return useMutation<void, unknown, TogglePlanActiveVars, TogglePlanActiveContext>({
    mutationFn: ({ id, isActive }) =>
      isActive ? subscriptionsApi.activatePlan(id) : subscriptionsApi.deactivatePlan(id),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: subscriptionKeys.plans() });
      const previous = qc.getQueriesData<PaginatedResponse<SubscriptionPlan>>({
        queryKey: subscriptionKeys.plans(),
      });
      qc.setQueriesData<PaginatedResponse<SubscriptionPlan>>(
        { queryKey: subscriptionKeys.plans() },
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? { ...item, isActive } : item,
            ),
          },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.plans() });
    },
  });
}

// ── Provider Subscriptions (READ ONLY) ──────────────────────────────────────

export function useProviderSubscriptions(params: SubscriptionListParams = {}) {
  return useQuery({
    queryKey: subscriptionKeys.providerSubscriptionList(params),
    queryFn: () => subscriptionsApi.listProviderSubscriptions(params),
    placeholderData: keepPreviousData,
  });
}

export function useProviderSubscription(id: number) {
  return useQuery({
    queryKey: subscriptionKeys.providerSubscription(id),
    queryFn: () => subscriptionsApi.getProviderSubscription(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
