/**
 * @file subscriptionsApi.ts
 * @description Real-backend API layer for `/api/SubscriptionPlans` and
 * `/api/ProviderSubscriptions`. Envelope-aware
 * (`{ success, message, data, errors }`) — the unwrap + `fromRawPage`
 * pattern mirrors `src/modules/orders/api/ordersApi.ts` (those helpers are
 * not exported there, so they are reproduced here precisely).
 *
 * READ endpoints return date-time strings WITHOUT a 'Z'/offset; they are
 * true UTC, so every read date is normalised with a trailing 'Z' here before
 * it leaves the api layer (isolated in `toUtcIso`).
 *
 * Plans: full CRUD except DELETE (no such endpoint). Activate/deactivate are
 * dedicated PATCH routes. Provider subscriptions: READ ONLY.
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";
import type {
  SubscriptionPlan,
  SubscriptionPlanWritePayload,
  ProviderSubscription,
} from "../types";

interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SubscriptionListParams {
  pageNumber?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 100;

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

function fromRawPage<T>(page: RawPage<T> | T[] | null | undefined): PaginatedResponse<T> {
  if (!page) {
    return { items: [], page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };
  }
  if (Array.isArray(page)) {
    return { items: page, page: 1, pageSize: DEFAULT_PAGE_SIZE, total: page.length, totalPages: page.length ? 1 : 0 };
  }
  return {
    items: page.items ?? [],
    page: page.pageNumber,
    pageSize: page.pageSize,
    total: page.totalCount,
    totalPages: page.totalPages,
  };
}

/**
 * Normalise a backend date-time string to a UTC ISO string. READ endpoints
 * return e.g. `2026-08-30T11:20:00` (no offset) but the value is UTC, so we
 * append 'Z'. Strings that already carry a 'Z' or a ±hh:mm offset are left
 * untouched; null/empty passes through.
 */
function toUtcIso(value: string): string;
function toUtcIso(value: string | null): string | null;
function toUtcIso(value: string | null): string | null {
  if (!value) return value;
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
  return `${value}Z`;
}

function adaptPlan(raw: SubscriptionPlan): SubscriptionPlan {
  return {
    ...raw,
    createdAt: toUtcIso(raw.createdAt),
    updatedAt: toUtcIso(raw.updatedAt),
  };
}

function adaptProviderSubscription(raw: ProviderSubscription): ProviderSubscription {
  return {
    ...raw,
    startDate: toUtcIso(raw.startDate),
    endDate: toUtcIso(raw.endDate),
    createdAt: toUtcIso(raw.createdAt),
    updatedAt: toUtcIso(raw.updatedAt),
  };
}

export const subscriptionsApi = {
  // ── Subscription Plans ────────────────────────────────────────────────────

  listPlans: async (
    params: SubscriptionListParams = {},
  ): Promise<PaginatedResponse<SubscriptionPlan>> => {
    const { data } = await apiClient.get<
      ApiEnvelope<RawPage<SubscriptionPlan> | SubscriptionPlan[] | null>
    >("/SubscriptionPlans", {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE),
      },
    });
    const page = fromRawPage(unwrap(data));
    return { ...page, items: page.items.map(adaptPlan) };
  },

  getPlan: async (id: number): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.get<ApiEnvelope<SubscriptionPlan>>(
      `/SubscriptionPlans/${id}`,
    );
    return adaptPlan(unwrap(data));
  },

  createPlan: async (payload: SubscriptionPlanWritePayload): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.post<ApiEnvelope<SubscriptionPlan>>(
      "/SubscriptionPlans",
      payload,
    );
    return adaptPlan(unwrap(data));
  },

  updatePlan: async (
    id: number,
    payload: SubscriptionPlanWritePayload,
  ): Promise<SubscriptionPlan> => {
    const { data } = await apiClient.put<ApiEnvelope<SubscriptionPlan>>(
      `/SubscriptionPlans/${id}`,
      payload,
    );
    return adaptPlan(unwrap(data));
  },

  activatePlan: async (id: number): Promise<void> => {
    await apiClient.patch(`/SubscriptionPlans/${id}/activate`);
  },

  deactivatePlan: async (id: number): Promise<void> => {
    await apiClient.patch(`/SubscriptionPlans/${id}/deactivate`);
  },

  // ── Provider Subscriptions (READ ONLY) ────────────────────────────────────

  listProviderSubscriptions: async (
    params: SubscriptionListParams = {},
  ): Promise<PaginatedResponse<ProviderSubscription>> => {
    const { data } = await apiClient.get<
      ApiEnvelope<RawPage<ProviderSubscription> | ProviderSubscription[] | null>
    >("/ProviderSubscriptions", {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE),
      },
    });
    const page = fromRawPage(unwrap(data));
    return { ...page, items: page.items.map(adaptProviderSubscription) };
  },

  getProviderSubscription: async (id: number): Promise<ProviderSubscription> => {
    const { data } = await apiClient.get<ApiEnvelope<ProviderSubscription>>(
      `/ProviderSubscriptions/${id}`,
    );
    return adaptProviderSubscription(unwrap(data));
  },
};
