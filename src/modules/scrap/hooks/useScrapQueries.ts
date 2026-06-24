/**
 * @file useScrapQueries.ts
 *
 * TanStack Query hooks for the scrap provider area.
 * Silent hooks — toasts live in UI components, not here.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scrapApi } from "../api/scrapApi";
import type { PartRequestsParams } from "../api/scrapApi";
import type { PartRequestStatus, SubmitOfferPayload, MyOffer } from "../types";
import { toOfferStatus } from "../lib/offerStatus";

export const scrapKeys = {
  all: ["scrap"] as const,
  profile: () => [...scrapKeys.all, "profile"] as const,
  subscription: () => [...scrapKeys.all, "subscription"] as const,
  stats: () => [...scrapKeys.all, "stats"] as const,
  partRequests: (params: PartRequestsParams = {}) =>
    [...scrapKeys.all, "part-requests", params] as const,
  partRequest: (id: string) => [...scrapKeys.all, "part-requests", id] as const,
  escrow: (partRequestId: string) =>
    [...scrapKeys.all, "escrow", partRequestId] as const,
  myOffers: () => [...scrapKeys.all, "my-offers"] as const,
};

export function useScrapProfileQuery() {
  return useQuery({
    queryKey: scrapKeys.profile(),
    queryFn: () => scrapApi.getProfile(),
  });
}

export function useUpdateScrapProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof scrapApi.updateProfile>[0]) =>
      scrapApi.updateProfile(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scrapKeys.profile() });
    },
  });
}

export function useScrapSubscriptionQuery() {
  return useQuery({
    queryKey: scrapKeys.subscription(),
    queryFn: () => scrapApi.getSubscription(),
  });
}

export function useRenewScrapSubscriptionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => scrapApi.renewSubscription(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: scrapKeys.subscription() });
    },
  });
}

export function useScrapStatsQuery() {
  return useQuery({
    queryKey: scrapKeys.stats(),
    queryFn: () => scrapApi.getStats(),
  });
}

export function usePartRequestsQuery(params: PartRequestsParams = {}) {
  return useQuery({
    queryKey: scrapKeys.partRequests(params),
    queryFn: () => scrapApi.getPartRequests(params),
  });
}

export function usePartRequestQuery(id: string) {
  return useQuery({
    queryKey: scrapKeys.partRequest(id),
    queryFn: () => scrapApi.getPartRequest(id),
    enabled: Boolean(id),
  });
}

export function useMyOffersQuery() {
  return useQuery({
    queryKey: scrapKeys.myOffers(),
    queryFn: async (): Promise<MyOffer[]> => {
      const result = await scrapApi.getPartRequests({ status: "all", pageSize: 100 });
      return result.items
        .filter((pr) => toOfferStatus(pr.status) !== null)
        .map((pr) => ({
          partRequestId: pr.id,
          requestNumber: pr.requestNumber,
          customerName: pr.customerName,
          vehicle: pr.vehicle,
          partName: pr.partName,
          offerPrice: pr.offerPrice ?? 0,
          offeredAt: pr.offeredAt ?? pr.createdAt,
          status: toOfferStatus(pr.status)!,
          escrowId: pr.escrowId,
        }));
    },
  });
}

export function useSubmitOfferMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubmitOfferPayload }) =>
      scrapApi.submitOffer(id, payload),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: scrapKeys.partRequest(id) });
      void qc.invalidateQueries({ queryKey: scrapKeys.partRequests() });
      void qc.invalidateQueries({ queryKey: scrapKeys.stats() });
      void qc.invalidateQueries({ queryKey: scrapKeys.escrow(id) });
      void qc.invalidateQueries({ queryKey: scrapKeys.myOffers() });
    },
  });
}

export function useUpdatePartRequestStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PartRequestStatus }) =>
      scrapApi.updatePartRequestStatus(id, status),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: scrapKeys.partRequest(id) });
      void qc.invalidateQueries({ queryKey: scrapKeys.partRequests() });
      void qc.invalidateQueries({ queryKey: scrapKeys.stats() });
      void qc.invalidateQueries({ queryKey: scrapKeys.escrow(id) });
      void qc.invalidateQueries({ queryKey: scrapKeys.myOffers() });
    },
  });
}

export function useEscrowQuery(partRequestId: string) {
  return useQuery({
    queryKey: scrapKeys.escrow(partRequestId),
    queryFn: () => scrapApi.getEscrow(partRequestId),
    enabled: Boolean(partRequestId),
  });
}
