/**
 * @file useOfferQueries.ts
 *
 * Dealer Offers React Query hooks — READ ONLY this stage. Hooks are silent
 * (no toasts — those live in UI components). Server-state via TanStack Query
 * only; no Redux.
 *
 * The query keys extend the shared dealer key factory (`dealerKeys.offers` /
 * `dealerKeys.offer(id)` — added in `useDealerQueries.ts`) so cache
 * invalidation from the Stage-3 mutations follows the existing pattern.
 *
 * Stage 3 adds the write mutations (`useCreateOffer` / `useUpdateOffer` /
 * `useDeleteOffer`). They stay silent — toasts live in the UI. Each one
 * invalidates the offers list key AND (for edit/delete) the specific offer
 * detail key, so the authoritative post-write state comes from a fresh GET,
 * never from the mutation response (which can echo a stale ghost of removed
 * lines — see `offersApi.ts`).
 */
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@shared/types/api";
import { offersApi } from "../api/offersApi";
import { dealerKeys } from "./useDealerQueries";
import type { DealerOffersListParams, Offer, OfferWritePayload } from "../types";

/** Token-scoped list of the logged-in dealer's own offers. */
export function useMyOffers(params: DealerOffersListParams = {}) {
  return useQuery({
    queryKey: dealerKeys.offers.list(params),
    queryFn: (): Promise<PaginatedResponse<Offer>> => offersApi.listMyOffers(params),
    placeholderData: keepPreviousData,
  });
}

/** Single offer by id — for the detail page. */
export function useOffer(id: string) {
  return useQuery({
    queryKey: dealerKeys.offers.detail(id),
    queryFn: (): Promise<Offer> => offersApi.getOffer(id),
    enabled: !!id,
  });
}

/** Create an offer. Invalidates the offers list so the new row is re-fetched. */
export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OfferWritePayload): Promise<Offer> => offersApi.createOffer(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dealerKeys.offers.all() });
    },
  });
}

/**
 * Update an offer. Invalidates BOTH the list and this offer's detail key so
 * the post-write render comes from a fresh GET (never the ghost response).
 */
export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OfferWritePayload }): Promise<Offer> =>
      offersApi.updateOffer(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.offers.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.offers.detail(id) });
    },
  });
}

/** Hard-delete an offer. Invalidates the list and drops the detail cache. */
export function useDeleteOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string): Promise<void> => offersApi.deleteOffer(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: dealerKeys.offers.all() });
      void qc.invalidateQueries({ queryKey: dealerKeys.offers.detail(id) });
    },
  });
}
