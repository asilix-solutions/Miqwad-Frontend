/**
 * @file useScrapPartsQueries.ts
 *
 * TanStack Query hooks for the scrap provider's parts catalog
 * (`/api/provider-services`) — mirrors the dealer products hooks, backed by
 * the shared `providerServicesApi`. Silent hooks — toasts live in UI
 * components, not here. Uses its own "scrap-parts" query key root so scrap
 * and dealer caches never collide even though both hit the same endpoint.
 */
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  providerServicesApi,
  adaptProviderService,
  adaptServiceCatalogItem,
  adaptToCreatePayload,
  adaptToUpdatePayload,
  type ProviderService,
  type ServiceCatalogItem,
} from "@shared/provider-services";
import type { ProviderServiceFormValues } from "@shared/provider-services";
import type { PaginatedResponse } from "@shared/types/api";

export const scrapPartsKeys = {
  all: ["scrap-parts"] as const,
  list: () => [...scrapPartsKeys.all, "list"] as const,
  detail: (id: string) => [...scrapPartsKeys.all, "detail", id] as const,
  serviceCatalog: () => [...scrapPartsKeys.all, "serviceCatalog"] as const,
};

/** The scrap provider's own provider-services rows, adapted to `ProviderService`. Caller-scoped by the backend — no filter params. */
export function useScrapPartsQuery() {
  return useQuery({
    queryKey: scrapPartsKeys.list(),
    queryFn: async (): Promise<PaginatedResponse<ProviderService>> => {
      const page = await providerServicesApi.list();
      return { ...page, items: page.items.map(adaptProviderService) };
    },
    placeholderData: keepPreviousData,
  });
}

/** Single-fetch by id — used for the edit dialog and detail view. */
export function useScrapPartQuery(id: string) {
  return useQuery({
    queryKey: scrapPartsKeys.detail(id),
    queryFn: async (): Promise<ProviderService> => adaptProviderService(await providerServicesApi.get(Number(id))),
    enabled: !!id,
  });
}

/** The admin service catalog (`GET /api/Services`) for the scrap parts picker. */
export function useScrapServiceCatalogQuery() {
  return useQuery({
    queryKey: scrapPartsKeys.serviceCatalog(),
    queryFn: async (): Promise<ServiceCatalogItem[]> => {
      const page = await providerServicesApi.getCatalog();
      return page.items.map(adaptServiceCatalogItem);
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateScrapPartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ProviderServiceFormValues) => providerServicesApi.create(adaptToCreatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scrapPartsKeys.all });
    },
  });
}

export function useUpdateScrapPartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<ProviderServiceFormValues, "serviceId"> }) =>
      providerServicesApi.update(Number(id), adaptToUpdatePayload(values)),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: scrapPartsKeys.all });
      void qc.invalidateQueries({ queryKey: scrapPartsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteScrapPartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providerServicesApi.remove(Number(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scrapPartsKeys.all });
    },
  });
}
