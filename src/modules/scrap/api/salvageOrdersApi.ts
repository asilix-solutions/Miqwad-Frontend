/**
 * @file salvageOrdersApi.ts
 *
 * Data layer for browsing incoming customer salvage part-requests. There is no
 * dedicated "part request" resource on the backend — a customer part request IS
 * an `Order` record with `OrderType = 2` (salvage).
 *
 * SOURCE: live. PHASE B (feat/scrap-quotations-live) — the list endpoint no
 * longer 400s for the salvage role; `GET /api/Orders?OrderType=2` is
 * caller-scoped and returns the salvage-shaped orders directly. The old
 * fixture fallback and the "list 400s for this role" workaround are gone.
 *
 * LIVE-PROVEN envelope:
 *   { success, message, data: { items[], pageNumber, pageSize, totalCount,
 *     totalPages }, errors }
 * Order fields (richer than swagger): id, status (NUMBER), brandName,
 * brandModel, brandYear, piecesName, serialNumber, attachments[] (
 * AttachmentResponseDto objects, NOT string[]), requestQuotations[] (inline,
 * empty in live today), createdAt (no TZ suffix), + standard order fields.
 * Detail: GET /api/Orders/{id} (same shape).
 *
 * The adapter below is the ONE place that knows the raw `Order` field names;
 * every other file binds only to the `SalvageOrder` view model from `../types`.
 */

import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";
import type { PaginatedResponse } from "@shared/types/api";
import type { SalvageOrder, SalvageOrderAttachment } from "../types";

/** Live-proven: `OrderType` integer query param, value 2 = salvage. */
const SALVAGE_ORDER_TYPE = 2;

// ── Raw backend shape (adapter input, matches the live GET /api/Orders shape) ──

interface RawAttachment {
  id?: number | string;
  originalFileName?: string | null;
  filePath?: string | null;
  contentType?: string | null;
}

interface RawSalvageOrder {
  id: number | string;
  userId?: number;
  userFullName?: string;
  orderType?: number;
  /** Live: numeric enum code (unconfirmed label mapping — every live order is 1). */
  status?: number;
  brandName?: string | null;
  brandModel?: string | null;
  brandYear?: string | null;
  piecesName?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  attachments?: RawAttachment[] | null;
  createdAt?: string | null;
}

interface RawOrdersPage {
  items: RawSalvageOrder[] | null;
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

// ── Adapter ──────────────────────────────────────────────────────────────────

function adaptAttachment(raw: RawAttachment): SalvageOrderAttachment {
  return {
    id: String(raw.id ?? ""),
    originalFileName: raw.originalFileName ?? "",
    filePath: raw.filePath ?? "",
    contentType: raw.contentType ?? "",
  };
}

function adaptSalvageOrder(raw: RawSalvageOrder): SalvageOrder {
  const attachments = (raw.attachments ?? [])
    .map(adaptAttachment)
    .filter((a) => a.filePath.length > 0);
  return {
    id: String(raw.id),
    partName: raw.piecesName ?? "",
    brand: raw.brandName ?? "",
    model: raw.brandModel ?? "",
    year: raw.brandYear ?? "",
    serialNumber: raw.serialNumber ?? undefined,
    description: raw.description ?? undefined,
    attachments,
    photos: attachments.map((a) => a.filePath),
    customerName: raw.userFullName ?? undefined,
    statusCode: typeof raw.status === "number" ? raw.status : 0,
    createdAt: raw.createdAt ?? "",
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SalvageOrdersParams {
  page?: number;
  pageSize?: number;
}

export const salvageOrdersApi = {
  list: async (
    params: SalvageOrdersParams = {},
  ): Promise<PaginatedResponse<SalvageOrder>> => {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 100;

    const { data } = await apiClient.get<ApiEnvelope<RawOrdersPage>>("/Orders", {
      params: {
        OrderType: SALVAGE_ORDER_TYPE,
        PageNumber: page,
        PageSize: pageSize,
      },
    });
    const raw = data.data;
    return {
      items: (raw.items ?? []).map(adaptSalvageOrder),
      page: raw.pageNumber ?? page,
      pageSize: raw.pageSize ?? pageSize,
      total: raw.totalCount ?? 0,
      totalPages: raw.totalPages ?? 1,
    };
  },

  get: async (id: string): Promise<SalvageOrder | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<RawSalvageOrder>>(
        `/Orders/${id}`,
      );
      return adaptSalvageOrder(data.data);
    } catch (err) {
      if (err instanceof AppError && (err.status === 403 || err.status === 404)) {
        return null;
      }
      throw err;
    }
  },
};
