/**
 * @file useOffersQueries.ts
 *
 * TanStack Query hooks for the scrap provider's own submitted Offers
 * (real /api/Offers — GET/POST/PUT/DELETE). Silent hooks — toasts live in
 * UI components, not here.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { offersApi } from "../api/offersApi";
import type { OffersParams } from "../api/offersApi";
import type { CreateOfferPayload, UpdateOfferPayload } from "../types";

export const offerKeys = {
  all: ["scrap", "offers"] as const,
  list: (params: OffersParams = {}) => [...offerKeys.all, "list", params] as const,
};

export function useOffersQuery(params: OffersParams = {}) {
  return useQuery({
    queryKey: offerKeys.list(params),
    queryFn: () => offersApi.list(params),
  });
}

export function useCreateOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => offersApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useUpdateOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOfferPayload }) =>
      offersApi.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}

export function useDeleteOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: offerKeys.all });
    },
  });
}
