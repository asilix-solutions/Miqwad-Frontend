/**
 * @file workshopApi.ts
 *
 * Thin API layer for the workshop provider area.
 * Mirrors the dealer pattern: one object with named async methods backed by
 * the shared apiClient. In dev the mock adapter in workshop.handlers.ts
 * intercepts all requests — swap internals for real axios calls when the
 * .NET backend exposes workshop endpoints.
 */

import { apiClient } from "@shared/lib/axios";
import type { WorkshopProfile, WorkshopSubscription } from "../types";

export const workshopApi = {
  // ── Profile ─────────────────────────────────────────────────────────────────

  getProfile: async (): Promise<WorkshopProfile> => {
    const { data } = await apiClient.get<WorkshopProfile>("/workshop/profile");
    return data;
  },

  updateProfile: async (payload: Partial<WorkshopProfile>): Promise<WorkshopProfile> => {
    const { data } = await apiClient.put<WorkshopProfile>("/workshop/profile", payload);
    return data;
  },

  // ── Subscription ─────────────────────────────────────────────────────────────

  getSubscription: async (): Promise<WorkshopSubscription> => {
    const { data } = await apiClient.get<WorkshopSubscription>("/workshop/subscription");
    return data;
  },

  renewSubscription: async (): Promise<WorkshopSubscription> => {
    const { data } = await apiClient.post<WorkshopSubscription>("/workshop/subscription/renew");
    return data;
  },
};
