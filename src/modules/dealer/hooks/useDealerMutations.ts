/**
 * @file useDealerMutations.ts
 *
 * Dealer React Query mutations.
 *
 * Orders are READ-ONLY (Phase B): the live `/api/Orders` backend exposes no
 * status-transition / ship / cancel endpoints, so there are no order
 * mutations here. Shipment status is still served by the mock bridge.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";
import { providerServicesApi, adaptToCreatePayload, adaptToUpdatePayload } from "@shared/provider-services";
import { dealerKeys } from "./useDealerQueries";
import type { ShipmentStatus } from "../types";
import type { ProductFormValues } from "../schemas/productSchema";

export function useCreateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) => providerServicesApi.create(adaptToCreatePayload(values)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
    },
  });
}

export function useUpdateProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Omit<ProductFormValues, "serviceId"> }) =>
      providerServicesApi.update(Number(id), adaptToUpdatePayload(values)),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.products.detail(variables.id) });
    },
  });
}

export function useDeleteProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providerServicesApi.remove(Number(id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.products.all() });
    },
  });
}

export function useUpdateShipmentStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ShipmentStatus }) =>
      dealerApi.updateShipmentStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.shipments.all() });
      // Delivering a shipment also marks the linked order delivered — invalidate orders too
      void qc.invalidateQueries({ queryKey: dealerKeys.orders.all() });
    },
  });
}
