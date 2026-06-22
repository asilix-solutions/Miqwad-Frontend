/**
 * @file scrapApi.ts
 *
 * Thin API layer for the scrap provider area.
 * Mirrors the workshop pattern: one object with named async methods backed by
 * the shared apiClient. In dev the mock adapter in scrap.handlers.ts
 * intercepts all requests — swap internals for real axios calls when the
 * .NET backend exposes scrap endpoints.
 */

import { apiClient } from "@shared/lib/axios";
import type {
  ScrapProfile,
  ScrapSubscription,
  PartRequest,
  Escrow,
  ScrapStats,
  SubmitOfferPayload,
  PartRequestStatus,
} from "../types";
import type { PaginatedResponse } from "@shared/types/api";

export interface PartRequestsParams {
  page?: number;
  pageSize?: number;
  status?: PartRequestStatus | "all";
  search?: string;
}

export const scrapApi = {
  // ── Profile ─────────────────────────────────────────────────────────────────

  getProfile: async (): Promise<ScrapProfile> => {
    const { data } = await apiClient.get<ScrapProfile>("/scrap/profile");
    return data;
  },

  updateProfile: async (payload: Partial<ScrapProfile>): Promise<ScrapProfile> => {
    const { data } = await apiClient.put<ScrapProfile>("/scrap/profile", payload);
    return data;
  },

  // ── Subscription ─────────────────────────────────────────────────────────────

  getSubscription: async (): Promise<ScrapSubscription> => {
    const { data } = await apiClient.get<ScrapSubscription>("/scrap/subscription");
    return data;
  },

  renewSubscription: async (): Promise<ScrapSubscription> => {
    const { data } = await apiClient.post<ScrapSubscription>("/scrap/subscription/renew");
    return data;
  },

  // ── Stats ────────────────────────────────────────────────────────────────────

  getStats: async (): Promise<ScrapStats> => {
    const { data } = await apiClient.get<ScrapStats>("/scrap/stats");
    return data;
  },

  // ── Part Requests ─────────────────────────────────────────────────────────────

  getPartRequests: async (params: PartRequestsParams = {}): Promise<PaginatedResponse<PartRequest>> => {
    const { data } = await apiClient.get<PaginatedResponse<PartRequest>>("/scrap/part-requests", {
      params,
    });
    return data;
  },

  getPartRequest: async (id: string): Promise<PartRequest> => {
    const { data } = await apiClient.get<PartRequest>(`/scrap/part-requests/${id}`);
    return data;
  },

  submitOffer: async (id: string, payload: SubmitOfferPayload): Promise<PartRequest> => {
    const { data } = await apiClient.post<PartRequest>(
      `/scrap/part-requests/${id}/offer`,
      payload,
    );
    return data;
  },

  updatePartRequestStatus: async (
    id: string,
    status: PartRequestStatus,
  ): Promise<PartRequest> => {
    const { data } = await apiClient.patch<PartRequest>(
      `/scrap/part-requests/${id}/status`,
      { status },
    );
    return data;
  },

  // ── Escrow (read-oriented for the scrap dealer) ───────────────────────────────

  getEscrow: async (partRequestId: string): Promise<Escrow> => {
    const { data } = await apiClient.get<Escrow>(`/scrap/escrow/${partRequestId}`);
    return data;
  },
};
