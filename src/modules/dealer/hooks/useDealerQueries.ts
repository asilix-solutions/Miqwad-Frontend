/**
 * Dealer React Query hooks
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";
import { providerServicesApi } from "../api/providerServicesApi";
import { adaptProviderService, adaptServiceCatalogItem } from "../lib/providerServiceAdapter";
import type { PaginatedResponse } from "@shared/types/api";
import type { Product, ServiceCatalogItem } from "../types";

export const dealerKeys = {
  all: ["dealer"] as const,
  products: {
    all: () => [...dealerKeys.all, "products"] as const,
    list: () => [...dealerKeys.products.all(), "list"] as const,
    detail: (id: string) => [...dealerKeys.products.all(), "detail", id] as const,
  },
  serviceCatalog: () => [...dealerKeys.all, "serviceCatalog"] as const,
  orders: {
    all: () => [...dealerKeys.all, "orders"] as const,
    list: (params?: Record<string, any>) => [...dealerKeys.orders.all(), "list", params] as const,
    detail: (id: string) => [...dealerKeys.orders.all(), "detail", id] as const,
  },
  shipments: {
    all: () => [...dealerKeys.all, "shipments"] as const,
    list: (params?: Record<string, any>) => [...dealerKeys.shipments.all(), "list", params] as const,
  },
  dues: () => [...dealerKeys.all, "dues"] as const,
};

/** The dealer's own provider-services rows, adapted to `Product`. Caller-scoped by the backend — no filter params. */
export function useDealerProductsQuery() {
  return useQuery({
    queryKey: dealerKeys.products.list(),
    queryFn: async (): Promise<PaginatedResponse<Product>> => {
      const page = await providerServicesApi.list();
      return { ...page, items: page.items.map(adaptProviderService) };
    },
    placeholderData: keepPreviousData,
  });
}

/** Single-fetch by id — used for the edit dialog and detail view. */
export function useDealerProductQuery(id: string) {
  return useQuery({
    queryKey: dealerKeys.products.detail(id),
    queryFn: async (): Promise<Product> => adaptProviderService(await providerServicesApi.get(Number(id))),
    enabled: !!id,
  });
}

/** The admin service catalog (`GET /api/Services`) for the dealer's service picker. */
export function useServiceCatalogQuery() {
  return useQuery({
    queryKey: dealerKeys.serviceCatalog(),
    queryFn: async (): Promise<ServiceCatalogItem[]> => {
      const page = await providerServicesApi.getCatalog();
      return page.items.map(adaptServiceCatalogItem);
    },
    staleTime: 5 * 60_000,
  });
}

export function useDealerOrdersQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: dealerKeys.orders.list(params),
    queryFn: () => dealerApi.getOrders(params),
    placeholderData: keepPreviousData,
  });
}

export function useDealerOrderQuery(id: string) {
  return useQuery({
    queryKey: dealerKeys.orders.detail(id),
    queryFn: () => dealerApi.getOrder(id),
    enabled: !!id,
  });
}

export function useDealerShipmentsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: dealerKeys.shipments.list(params),
    queryFn: () => dealerApi.getShipments(params),
    placeholderData: keepPreviousData,
  });
}

export function useDealerDuesQuery() {
  return useQuery({
    queryKey: dealerKeys.dues(),
    queryFn: () => dealerApi.getDues(),
  });
}
