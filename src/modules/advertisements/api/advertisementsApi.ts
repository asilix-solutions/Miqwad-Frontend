/**
 * @file advertisementsApi.ts
 * @description Real-backend API layer for /api/Advertisement — a flat CRUD
 * resource (id, title, image, deepLink, isActive, createdAt, updatedAt).
 *
 * Envelope-aware: `{ success, message, data:{ items[], pageNumber, pageSize,
 * totalCount, totalPages }, errors }` — `data` IS the page. Mirrors the
 * `unwrap()` / `fromRawPage()` pattern from
 * src/modules/orders/api/ordersApi.ts (kept as a local mirror rather than a
 * shared extraction).
 *
 * POST/PUT are multipart (Title, Image, DeepLink, IsActive). IsActive is
 * serialized as the string "true"/"false" — mirrors the pattern documented
 * in src/modules/scrap/api/requestQuotationsApi.ts for the Price int-binder;
 * if the server rejects this format, switch to "1"/"0" here (single place).
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type {
  Advertisement,
  AdvertisementsListParams,
  CreateAdvertisementInput,
  RawAdvertisement,
  UpdateAdvertisementInput,
} from "../types";

interface RawPage<T> {
  items: T[];
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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

function fromRawPage(page: RawPage<RawAdvertisement> | RawAdvertisement[] | null | undefined): PaginatedResponse<RawAdvertisement> {
  if (!page) {
    return { items: [], page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 };
  }
  if (Array.isArray(page)) {
    return {
      items: page,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      total: page.length,
      totalPages: page.length ? 1 : 0,
    };
  }
  return {
    items: page.items ?? [],
    page: page.pageNumber,
    pageSize: page.pageSize,
    total: page.totalCount,
    totalPages: page.totalPages,
  };
}

/** Thin raw→view adapter. Currently a 1:1 passthrough. */
export function adaptRawAdvertisement(raw: RawAdvertisement): Advertisement {
  return {
    id: String(raw.id),
    title: raw.title,
    image: raw.image,
    deepLink: raw.deepLink,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Shared multipart body for POST/PUT. */
function buildForm(input: CreateAdvertisementInput | UpdateAdvertisementInput): FormData {
  const form = new FormData();
  form.append("Title", input.title);
  form.append("DeepLink", input.deepLink);
  form.append("IsActive", String(input.isActive));
  if (input.image) form.append("Image", input.image);
  return form;
}

export const advertisementsApi = {
  list: async (params: AdvertisementsListParams = {}): Promise<PaginatedResponse<RawAdvertisement>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawAdvertisement> | RawAdvertisement[] | null>>(
      "/Advertisement",
      {
        params: {
          PageNumber: params.pageNumber ?? 1,
          PageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
          SortBy: params.sortBy,
          SortDescending: params.sortDescending,
        },
      },
    );
    return fromRawPage(unwrap(data));
  },

  get: async (id: string): Promise<RawAdvertisement> => {
    const { data } = await apiClient.get<ApiEnvelope<RawAdvertisement>>(`/Advertisement/${id}`);
    return unwrap(data);
  },

  create: async (input: CreateAdvertisementInput): Promise<RawAdvertisement> => {
    const { data } = await apiClient.post<ApiEnvelope<RawAdvertisement>>(
      "/Advertisement",
      buildForm(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(data);
  },

  update: async (id: string, input: UpdateAdvertisementInput): Promise<RawAdvertisement> => {
    const { data } = await apiClient.put<ApiEnvelope<RawAdvertisement>>(
      `/Advertisement/${id}`,
      buildForm(input),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Advertisement/${id}`);
  },
};
