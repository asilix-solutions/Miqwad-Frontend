/**
 * @file useAdvertisementsQueries.ts
 * @description TanStack Query hooks for the admin Advertisements module
 * (live /api/Advertisement — GET list/detail, POST, PUT, DELETE). Server-state
 * only — no Redux slice. Silent hooks; toasts live in UI components.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData, type QueryKey } from "@tanstack/react-query";
import { advertisementsApi, adaptRawAdvertisement } from "../api/advertisementsApi";
import type { PaginatedResponse } from "@shared/types/api";
import type {
  Advertisement,
  AdvertisementsListParams,
  CreateAdvertisementInput,
  UpdateAdvertisementInput,
} from "../types";

export const advertisementKeys = {
  all: ["advertisements"] as const,
  lists: () => [...advertisementKeys.all, "list"] as const,
  list: (params: AdvertisementsListParams = {}) => [...advertisementKeys.lists(), params] as const,
  detail: (id: string) => [...advertisementKeys.all, "detail", id] as const,
};

export function useAdvertisementsList(params: AdvertisementsListParams = {}) {
  return useQuery({
    queryKey: advertisementKeys.list(params),
    queryFn: async () => {
      const page = await advertisementsApi.list(params);
      return { ...page, items: page.items.map(adaptRawAdvertisement) };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdvertisement(id: string) {
  return useQuery({
    queryKey: advertisementKeys.detail(id),
    queryFn: async () => adaptRawAdvertisement(await advertisementsApi.get(id)),
    enabled: !!id,
  });
}

export function useCreateAdvertisementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdvertisementInput) => advertisementsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: advertisementKeys.lists() });
    },
  });
}

export function useUpdateAdvertisementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdvertisementInput }) =>
      advertisementsApi.update(id, input),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: advertisementKeys.lists() });
      void qc.invalidateQueries({ queryKey: advertisementKeys.detail(id) });
    },
  });
}

export function useDeleteAdvertisementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advertisementsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: advertisementKeys.lists() });
    },
  });
}

interface ToggleActiveVars {
  ad: Advertisement;
  isActive: boolean;
}

interface ToggleActiveContext {
  previous: [QueryKey, PaginatedResponse<Advertisement> | undefined][];
}

/**
 * Optimistic isActive quick-toggle (card/row switch) — PUTs the full form
 * with only `isActive` flipped (image omitted keeps the current one). Rolls
 * back every affected list cache entry on failure.
 */
export function useToggleAdvertisementActiveMutation() {
  const qc = useQueryClient();
  return useMutation<Advertisement, unknown, ToggleActiveVars, ToggleActiveContext>({
    mutationFn: async ({ ad, isActive }) => {
      const raw = await advertisementsApi.update(ad.id, {
        title: ad.title,
        deepLink: ad.deepLink,
        isActive,
      });
      return adaptRawAdvertisement(raw);
    },
    onMutate: async ({ ad, isActive }) => {
      await qc.cancelQueries({ queryKey: advertisementKeys.lists() });
      const previous = qc.getQueriesData<PaginatedResponse<Advertisement>>({
        queryKey: advertisementKeys.lists(),
      });
      qc.setQueriesData<PaginatedResponse<Advertisement>>(
        { queryKey: advertisementKeys.lists() },
        (old) =>
          old && {
            ...old,
            items: old.items.map((item) => (item.id === ad.id ? { ...item, isActive } : item)),
          },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: advertisementKeys.lists() });
    },
  });
}
