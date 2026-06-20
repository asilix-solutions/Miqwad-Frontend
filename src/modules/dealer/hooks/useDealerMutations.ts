/**
 * Dealer React Query mutations
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";
import { dealerKeys } from "./useDealerQueries";
import type { Product, ProductStatus, OrderStatus } from "../types";

export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Product>) => dealerApi.createProduct(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
    },
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Product> }) =>
      dealerApi.updateProduct(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.products.detail(variables.id) });
    },
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealerApi.deleteProduct(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
    },
  });
}

export function useUpdateProductStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      dealerApi.updateProductStatus(id, status),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.products.detail(variables.id) });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      dealerApi.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.detail(variables.id) });
    },
  });
}

export function useShipOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { carrier?: string; trackingNumber?: string };
    }) => dealerApi.shipOrder(id, payload),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.detail(variables.id) });
      void qc.invalidateQueries({ queryKey: dealerKeys.shipments.all() });
    },
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      dealerApi.cancelOrder(id, reason),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.detail(variables.id) });
    },
  });
}
