/**
 * @file offersApi.ts
 *
 * Real API layer for scrap-provider Offers — GET/POST/PUT/DELETE /api/Offers.
 * Confirmed backend contract (live Swagger 2026-08-23):
 *   POST  { orderId, providerServiceId, startDate, endDate }
 *   PUT   { providerServiceId, startDate, endDate }  — orderId excluded
 *   GET   paginated; providerService.attachments[].filePath → images[]
 *
 * Date conversion: the UI collects date-only strings (YYYY-MM-DD); this layer
 * appends "T00:00:00Z" to produce a valid ISO-8601 date-time for the backend.
 * This is a mechanical boundary-only conversion — no business semantics implied.
 */

import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Offer, OfferProviderService, CreateOfferPayload, UpdateOfferPayload } from "../types";

// ── Raw shapes ───────────────────────────────────────────────────────────────

interface RawAttachment {
  filePath?: string;
  [key: string]: unknown;
}

interface RawProviderService {
  id: number | string;
  serviceId?: number | string;
  serviceName?: string | null;
  quantity?: number;
  price?: number;
  notes?: string | null;
  isCompatibleWith?: string | null;
  attachments?: RawAttachment[];
}

interface RawOffer {
  id: number | string;
  orderId: number | string;
  providerServiceId: number | string;
  startDate: string;
  endDate: string;
  providerService?: RawProviderService | null;
  createdAt: string;
}

interface RawOffersPage {
  items: RawOffer[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ── Adapters ─────────────────────────────────────────────────────────────────

function adaptProviderService(raw: RawProviderService): OfferProviderService {
  return {
    id: String(raw.id),
    serviceId: raw.serviceId !== undefined ? String(raw.serviceId) : "",
    serviceName: raw.serviceName ?? null,
    quantity: raw.quantity ?? 0,
    price: raw.price ?? 0,
    notes: raw.notes ?? null,
    isCompatibleWith: raw.isCompatibleWith ?? null,
    images: (raw.attachments ?? [])
      .map((a) => a.filePath)
      .filter((fp): fp is string => typeof fp === "string" && fp.length > 0),
  };
}

function adaptOffer(raw: RawOffer): Offer {
  return {
    id: String(raw.id),
    orderId: String(raw.orderId),
    providerServiceId: String(raw.providerServiceId),
    startDate: raw.startDate,
    endDate: raw.endDate,
    providerService: raw.providerService ? adaptProviderService(raw.providerService) : null,
    createdAt: raw.createdAt,
  };
}

/**
 * Converts a date-only string (YYYY-MM-DD) to an ISO-8601 date-time string
 * required by the backend. Pure mechanical boundary conversion.
 */
function toDateTime(dateOnly: string): string {
  // If already a full datetime, return as-is
  if (dateOnly.includes("T")) return dateOnly;
  return `${dateOnly}T00:00:00Z`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface OffersParams {
  page?: number;
  pageSize?: number;
}

export const offersApi = {
  list: async (params: OffersParams = {}): Promise<PaginatedResponse<Offer>> => {
    const { data } = await apiClient.get<{ data: RawOffersPage }>("/Offers", {
      params: { PageNumber: params.page ?? 1, PageSize: params.pageSize ?? 100 },
    });
    const raw = data.data;
    return {
      items: (raw.items ?? []).map(adaptOffer),
      page: raw.pageNumber,
      pageSize: raw.pageSize,
      total: raw.totalCount,
      totalPages: raw.totalPages,
    };
  },

  create: async (payload: CreateOfferPayload): Promise<Offer> => {
    const body = {
      orderId: Number(payload.orderId),
      providerServiceId: Number(payload.providerServiceId),
      startDate: toDateTime(payload.startDate),
      endDate: toDateTime(payload.endDate),
    };
    const { data } = await apiClient.post<{ data: RawOffer }>("/Offers", body);
    return adaptOffer(data.data);
  },

  update: async (id: string, payload: UpdateOfferPayload): Promise<Offer> => {
    // orderId MUST NOT be included per the confirmed PUT contract
    const body = {
      providerServiceId: Number(payload.providerServiceId),
      startDate: toDateTime(payload.startDate),
      endDate: toDateTime(payload.endDate),
    };
    const { data } = await apiClient.put<{ data: RawOffer }>(`/Offers/${id}`, body);
    return adaptOffer(data.data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Offers/${id}`);
  },
};
