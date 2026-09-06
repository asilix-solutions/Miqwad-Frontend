/**
 * @file offersApi.ts
 *
 * Dealer Offers API client — READ ONLY (Stage 1 of a staged build).
 *
 * Endpoint truth is from LIVE GET probes, NOT Swagger:
 *   - `GET /api/Offers` is TOKEN-SCOPED — it returns only the logged-in
 *     dealer's offers, so this is the dealer's "my offers" management list.
 *     We deliberately do NOT touch `/api/Offers/provider/{id}` or
 *     `/api/Offers/active` (those are un-scoped discovery endpoints).
 *   - `GET /api/Offers/{id}` — same `OfferResponseDto` shape as a list row.
 *
 * Envelope: `{ success, message, data:{ items[], pageNumber, pageSize,
 * totalCount, totalPages }, errors }`. The `unwrap` + `fromRawPage` helpers
 * mirror `src/modules/dealer/api/dealerApi.ts` and
 * `src/modules/subscriptions/api/subscriptionsApi.ts` precisely — those
 * helpers are not exported from a shared module, so they are reproduced here.
 *
 * Dates from the API carry NO timezone suffix but represent UTC, so on READ
 * every date field is normalised with a trailing 'Z' here (isolated in
 * `toUtcIso`) before it leaves the api layer. `id` fields are int64 on the
 * wire and are coerced to `string` per project convention.
 *
 * Stage 3 adds the WRITE path (`createOffer` / `updateOffer` / `deleteOffer`).
 * Confirmed by the write-probe:
 *   - CREATE + UPDATE share ONE DTO: `{ title, startDate, endDate, items:[
 *     { providerServiceId:number, discountAmount:number } ] }`.
 *   - `providerId` and all computed fields are OMITTED (server infers / fills).
 *   - Dates are sent BARE-LOCAL — no 'Z', no offset (isolated in `toBareLocal`).
 *   - PUT is a FULL REPLACE of `items`; the mutation response echoes a stale
 *     ghost of removed lines, so callers MUST re-GET (via query invalidation)
 *     and never render items from the write response.
 *   - DELETE is hard (`200` then `404`).
 */
import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";
import type {
  DealerOffersListParams,
  Offer,
  OfferItem,
  OfferWritePayload,
} from "../types";

// ── Raw wire contract (GET /api/Offers — confirmed via live probe) ───────────

interface RawOfferItem {
  id: number;
  providerServiceId: number;
  serviceName: string | null;
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
}

interface RawOffer {
  id: number;
  title: string | null;
  startDate: string;
  endDate: string;
  providerId: number;
  providerName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  items: RawOfferItem[] | null;
}

interface RawOffersPage {
  items: RawOffer[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 20;

// ── Envelope + page helpers (mirrored from dealerApi.ts) ─────────────────────

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

function fromRawPage(
  page: RawOffersPage | null | undefined,
): PaginatedResponse<RawOffer> {
  if (!page) {
    return { items: [], page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };
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
 * Normalise a backend date-time string to a UTC ISO string. The Offers read
 * endpoints return e.g. `2026-09-01T00:00:00` (no offset) but the value is
 * UTC, so we append 'Z'. Strings that already carry a 'Z' or a ±hh:mm offset
 * are left untouched; null / empty passes through.
 */
function toUtcIso(value: string): string;
function toUtcIso(value: string | null): string | null;
function toUtcIso(value: string | null): string | null {
  if (!value) return value;
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
  return `${value}Z`;
}

/**
 * Normalise a form date to the BARE-LOCAL string the write endpoints expect:
 * `"2026-09-05T00:00:00"` — NO trailing 'Z', NO offset. The backend stores and
 * returns the value verbatim. Accepts either a `YYYY-MM-DD` date-input value or
 * a fuller ISO string (only the date portion is used; time is pinned to
 * midnight, matching the probe).
 */
function toBareLocal(value: string): string {
  const datePart = value.slice(0, 10);
  return `${datePart}T00:00:00`;
}

/** Build the confirmed write DTO — only the fields the probe accepted. */
function toWriteBody(payload: OfferWritePayload) {
  return {
    title: payload.title,
    startDate: toBareLocal(payload.startDate),
    endDate: toBareLocal(payload.endDate),
    items: payload.items.map((line) => ({
      providerServiceId: Number(line.providerServiceId),
      discountAmount: line.discountAmount,
    })),
  };
}

/**
 * Pull the backend's flat, already-localised validation strings out of a
 * rejected write (the `errors[]` array on a 400 envelope). Returns `[]` when
 * the failure carries none — the caller then falls back to a generic message.
 */
export function extractOfferWriteErrors(error: unknown): string[] {
  if (error instanceof AppError && error.errors && error.errors.length > 0) {
    return error.errors;
  }
  return [];
}

// ── Adapters (raw → internal view model) ─────────────────────────────────────

function adaptItem(raw: RawOfferItem): OfferItem {
  return {
    id: String(raw.id),
    providerServiceId: String(raw.providerServiceId),
    serviceName: raw.serviceName,
    originalPrice: raw.originalPrice,
    discountAmount: raw.discountAmount,
    discountedPrice: raw.discountedPrice,
  };
}

function adaptOffer(raw: RawOffer): Offer {
  return {
    id: String(raw.id),
    title: raw.title,
    startDate: toUtcIso(raw.startDate),
    endDate: toUtcIso(raw.endDate),
    providerId: String(raw.providerId),
    providerName: raw.providerName,
    isActive: raw.isActive,
    createdAt: toUtcIso(raw.createdAt),
    updatedAt: toUtcIso(raw.updatedAt),
    items: (raw.items ?? []).map(adaptItem),
  };
}

// ── Client ──────────────────────────────────────────────────────────────────

export const offersApi = {
  /** Token-scoped list of the logged-in dealer's own offers. */
  listMyOffers: async (
    params: DealerOffersListParams = {},
  ): Promise<PaginatedResponse<Offer>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawOffersPage | null>>("/Offers", {
      params: {
        PageNumber: params.pageNumber ?? 1,
        PageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      },
    });
    const page = fromRawPage(unwrap(data));
    return { ...page, items: page.items.map(adaptOffer) };
  },

  /** Single offer by id (same DTO as a list row). */
  getOffer: async (id: string): Promise<Offer> => {
    const { data } = await apiClient.get<ApiEnvelope<RawOffer>>(`/Offers/${id}`);
    return adaptOffer(unwrap(data));
  },

  /**
   * Create an offer (`POST /api/Offers`). The response is adapted and returned
   * for convenience, but callers MUST NOT render items from it — it can echo a
   * stale ghost. Re-GET via query invalidation instead.
   */
  createOffer: async (payload: OfferWritePayload): Promise<Offer> => {
    const { data } = await apiClient.post<ApiEnvelope<RawOffer>>("/Offers", toWriteBody(payload));
    return adaptOffer(unwrap(data));
  },

  /**
   * Update an offer (`PUT /api/Offers/{id}`) — FULL REPLACE, always send the
   * complete `items` array. Same ghost-response caveat as `createOffer`.
   */
  updateOffer: async (id: string, payload: OfferWritePayload): Promise<Offer> => {
    const { data } = await apiClient.put<ApiEnvelope<RawOffer>>(
      `/Offers/${id}`,
      toWriteBody(payload),
    );
    return adaptOffer(unwrap(data));
  },

  /** Hard-delete an offer (`DELETE /api/Offers/{id}`). */
  deleteOffer: async (id: string): Promise<void> => {
    await apiClient.delete(`/Offers/${id}`);
  },
};
