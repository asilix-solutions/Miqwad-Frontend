/**
 * @file requestQuotationsApi.ts
 *
 * Data layer for the scrap provider's own salvage quotations — the live
 * `/api/request-quotations` family. Replaces the retired `/api/Offers`.
 *
 * LIVE-PROVEN contract (PHASE B, feat/scrap-quotations-live):
 *   GET  /api/request-quotations            → caller-scoped list (envelope below)
 *   GET  /api/request-quotations/{id}       → one quotation
 *   POST /api/request-quotations            → multipart, 201
 *        OrderId*, Name*(<=150), Quantity*(int>=1), Price*(int>=1 — whole
 *        number binder, decimals 400), Notes(<=2000),
 *        IsCompatibleWith(<=500), Files[]
 *   PUT  /api/request-quotations/{id}       → multipart, 200
 *        Name*, Quantity*(int>=1), Price*(int>=1), Notes, IsCompatibleWith,
 *        Files[]  (OrderId NOT accepted — path-bound)
 *   DELETE /api/request-quotations/{id}     → 200
 *
 * Envelope: { success, message, data, errors }. List `data` is
 * { items[], pageNumber, pageSize, totalCount, totalPages }.
 *
 * Quantity & Price are HIDDEN in the UI per product decision (server rejects
 * 0 and any decimal); this layer always injects the whole-number
 * QUOTATION_PLACEHOLDER_QUANTITY / _PRICE.
 * The adapter below is the ONE place that knows the raw field names.
 */

import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import {
  QUOTATION_PLACEHOLDER_PRICE,
  QUOTATION_PLACEHOLDER_QUANTITY,
} from "../types";
import type {
  CreateQuotationInput,
  RequestQuotation,
  RequestQuotationAttachment,
  UpdateQuotationInput,
} from "../types";

// ── Raw shapes ───────────────────────────────────────────────────────────────

interface RawAttachment {
  id?: number | string;
  originalFileName?: string | null;
  filePath?: string | null;
  contentType?: string | null;
}

interface RawRequestQuotation {
  id: number | string;
  orderId: number | string;
  name?: string | null;
  quantity?: number | null;
  price?: number | null;
  notes?: string | null;
  isCompatibleWith?: string | null;
  attachments?: RawAttachment[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface RawPage {
  items: RawRequestQuotation[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

// ── Adapters ─────────────────────────────────────────────────────────────────

function adaptAttachment(raw: RawAttachment): RequestQuotationAttachment {
  return {
    id: String(raw.id ?? ""),
    originalFileName: raw.originalFileName ?? "",
    filePath: raw.filePath ?? "",
    contentType: raw.contentType ?? "",
  };
}

function adaptQuotation(raw: RawRequestQuotation): RequestQuotation {
  return {
    id: String(raw.id),
    orderId: String(raw.orderId),
    name: raw.name ?? "",
    quantity: typeof raw.quantity === "number" ? raw.quantity : 0,
    price: typeof raw.price === "number" ? raw.price : 0,
    notes: raw.notes ?? null,
    isCompatibleWith: raw.isCompatibleWith ?? null,
    attachments: (raw.attachments ?? [])
      .map(adaptAttachment)
      .filter((a) => a.filePath.length > 0),
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? null,
  };
}

/** Shared multipart body for POST/PUT. `orderId` only present on create. */
function buildForm(
  input: CreateQuotationInput | UpdateQuotationInput,
  orderId?: string,
): FormData {
  const form = new FormData();
  if (orderId != null) form.append("OrderId", orderId);
  form.append("Name", input.name);
  // Server binds Price/Quantity with a whole-number model binder: decimal
  // strings ("0.01", "0,01", "1.00") 400 with "not valid for Price". Only
  // bare integers parse. Both fields are hidden in the UI per product
  // decision; "1" is a parseable positive placeholder, NOT a real quote.
  // String(1) === "1", so these serialize in the accepted format.
  // TODO: revisit if backend switches Price to a decimal binder.
  form.append("Quantity", String(QUOTATION_PLACEHOLDER_QUANTITY));
  form.append("Price", String(QUOTATION_PLACEHOLDER_PRICE));
  if (input.notes) form.append("Notes", input.notes);
  if (input.isCompatibleWith) form.append("IsCompatibleWith", input.isCompatibleWith);
  for (const file of input.files ?? []) form.append("Files", file);
  return form;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface RequestQuotationsParams {
  page?: number;
  pageSize?: number;
}

export const requestQuotationsApi = {
  list: async (
    params: RequestQuotationsParams = {},
  ): Promise<PaginatedResponse<RequestQuotation>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 100;
    const { data } = await apiClient.get<ApiEnvelope<RawPage>>(
      "/request-quotations",
      { params: { PageNumber: page, PageSize: pageSize } },
    );
    const raw = data.data;
    return {
      items: (raw.items ?? []).map(adaptQuotation),
      page: raw.pageNumber ?? page,
      pageSize: raw.pageSize ?? pageSize,
      total: raw.totalCount ?? 0,
      totalPages: raw.totalPages ?? 1,
    };
  },

  get: async (id: string): Promise<RequestQuotation> => {
    const { data } = await apiClient.get<ApiEnvelope<RawRequestQuotation>>(
      `/request-quotations/${id}`,
    );
    return adaptQuotation(data.data);
  },

  create: async (input: CreateQuotationInput): Promise<RequestQuotation> => {
    const { data } = await apiClient.post<ApiEnvelope<RawRequestQuotation>>(
      "/request-quotations",
      buildForm(input, input.orderId),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return adaptQuotation(data.data);
  },

  update: async (
    id: string,
    input: UpdateQuotationInput,
  ): Promise<RequestQuotation> => {
    const { data } = await apiClient.put<ApiEnvelope<RawRequestQuotation>>(
      `/request-quotations/${id}`,
      buildForm(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return adaptQuotation(data.data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/request-quotations/${id}`);
  },
};
