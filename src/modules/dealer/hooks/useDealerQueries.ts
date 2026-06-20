/**
 * Dealer React Query hooks
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";

export const dealerKeys = {
  all: ["dealer"] as const,
  products: {
    all: () => [...dealerKeys.all, "products"] as const,
    list: (params?: Record<string, any>) => [...dealerKeys.products.all(), "list", params] as const,
    detail: (id: string) => [...dealerKeys.products.all(), "detail", id] as const,
  },
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

export function useDealerProductsQuery(params?: Record<string, any>) {
  return useQuery({
    queryKey: dealerKeys.products.list(params),
    queryFn: () => dealerApi.getProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useDealerProductQuery(id: string) {
  return useQuery({
    queryKey: dealerKeys.products.detail(id),
    queryFn: () => dealerApi.getProduct(id),
    enabled: !!id,
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
