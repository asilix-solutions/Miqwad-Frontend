/**
 * Dealer React Query mutations
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";
import { dealerKeys } from "./useDealerQueries";
import type { Product, ProductStatus } from "../types";

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
