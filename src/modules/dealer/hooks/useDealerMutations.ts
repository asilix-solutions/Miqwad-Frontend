/**
 * Dealer React Query mutations
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dealerApi } from "../api/dealerApi";
import { providerServicesApi } from "../api/providerServicesApi";
import { adaptToCreatePayload, adaptToUpdatePayload } from "../lib/providerServiceAdapter";
import { dealerKeys } from "./useDealerQueries";
import type { OrderStatus, ShipmentStatus } from "../types";
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
