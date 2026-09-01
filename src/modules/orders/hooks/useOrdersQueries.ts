/**
 * @file useOrdersQueries.ts
 * @description TanStack Query hooks for the admin Orders module. Hooks are
 * silent — toasts are shown by the calling UI, not here. Mutations
 * invalidate the order list/detail query keys. No create hook — orders are
 * created by customers, not admins.
 */
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ordersApi, type OrdersListParams } from "../api/ordersApi";
import { adaptRawOrder, adaptRawOrderDetail, adaptToUpdatePayload } from "../lib/orderAdapter";
import type { UpdateOrderInput } from "../types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: OrdersListParams = {}) => [...orderKeys.all, "list", params] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export function useOrdersList(params: OrdersListParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: async () => {
      const page = await ordersApi.list(params);
      return { ...page, items: page.items.map(adaptRawOrder) };
    },
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => adaptRawOrderDetail(await ordersApi.get(id)),
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderInput }) =>
      ordersApi.update(id, adaptToUpdatePayload(input)),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: orderKeys.all });
      void qc.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
    },
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
