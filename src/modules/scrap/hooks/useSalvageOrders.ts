/**
 * @file useSalvageOrders.ts
 *
 * TanStack Query hooks for browsing live salvage orders (customer part
 * requests) — GET /api/Orders?OrderType=2 via `salvageOrdersApi`.
 * Silent hooks — toasts live in UI components, not here.
 */

import { useQuery } from "@tanstack/react-query";
import { salvageOrdersApi } from "../api/salvageOrdersApi";
import type { SalvageOrdersParams } from "../api/salvageOrdersApi";

export const salvageOrderKeys = {
  all: ["scrap", "salvage-orders"] as const,
  list: (params: SalvageOrdersParams = {}) => [...salvageOrderKeys.all, "list", params] as const,
  detail: (id: string) => [...salvageOrderKeys.all, "detail", id] as const,
};

export function useSalvageOrdersQuery(params: SalvageOrdersParams = {}) {
  return useQuery({
    queryKey: salvageOrderKeys.list(params),
    queryFn: () => salvageOrdersApi.list(params),
  });
}

export function useSalvageOrderQuery(id: string) {
  return useQuery({
    queryKey: salvageOrderKeys.detail(id),
    queryFn: () => salvageOrdersApi.get(id),
    enabled: Boolean(id),
  });
}
