/**
 * @file useRequestQuotations.ts
 *
 * TanStack Query hooks for the scrap provider's own salvage quotations
 * (live `/api/request-quotations` — GET list/detail, POST, PUT, DELETE).
 * Silent hooks — toasts live in UI components, not here.
 *
 * The "not yet quoted" derivation (an order is not-yet-quoted iff its id is
 * absent from the quotations list) reads from the same list query, so
 * invalidating `quotationKeys.lists()` refreshes both surfaces at once.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { requestQuotationsApi } from "../api/requestQuotationsApi";
import type { RequestQuotationsParams } from "../api/requestQuotationsApi";
import { salvageOrderKeys } from "./useSalvageOrders";
import type { CreateQuotationInput, UpdateQuotationInput } from "../types";

export const quotationKeys = {
  all: ["scrap", "request-quotations"] as const,
  lists: () => [...quotationKeys.all, "list"] as const,
  list: (params: RequestQuotationsParams = {}) =>
    [...quotationKeys.lists(), params] as const,
  detail: (id: string) => [...quotationKeys.all, "detail", id] as const,
};

export function useRequestQuotationsQuery(params: RequestQuotationsParams = {}) {
  return useQuery({
    queryKey: quotationKeys.list(params),
    queryFn: () => requestQuotationsApi.list(params),
  });
}

export function useRequestQuotationQuery(id: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => requestQuotationsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuotationInput) => requestQuotationsApi.create(input),
    onSuccess: (_data, input) => {
      void qc.invalidateQueries({ queryKey: quotationKeys.lists() });
      void qc.invalidateQueries({ queryKey: salvageOrderKeys.detail(input.orderId) });
    },
  });
}

export function useUpdateQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateQuotationInput }) =>
      requestQuotationsApi.update(id, input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: quotationKeys.lists() });
      void qc.invalidateQueries({ queryKey: quotationKeys.detail(data.id) });
      void qc.invalidateQueries({ queryKey: salvageOrderKeys.detail(data.orderId) });
    },
  });
}

export function useDeleteQuotationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; orderId?: string }) =>
      requestQuotationsApi.remove(id),
    onSuccess: (_data, { orderId }) => {
      void qc.invalidateQueries({ queryKey: quotationKeys.lists() });
      if (orderId) {
        void qc.invalidateQueries({ queryKey: salvageOrderKeys.detail(orderId) });
      }
    },
  });
}
