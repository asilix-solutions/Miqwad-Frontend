/**
 * @file providerServicesApi.ts
 * @description Transport layer for the dealer "products" flow, which is a
 * thin wrapper around the admin service catalog — no free-standing product
 * entity exists. Confirmed live contract (Dealer JWT probe, token-stripped):
 *  - Envelope: `{ success, message, data, errors }` on every response.
 *  - `POST/GET/PUT/DELETE /api/provider-services` — the dealer's own
 *    offerings, caller-scoped by the backend from the JWT. `providerId` is
 *    server-derived and must never be sent on write.
 *  - `GET /api/Services` — the admin-managed service catalog (Dealer-403 on
 *    `/api/Categories` and `/Services/{id}/children`, so this list endpoint
 *    is the only source for the picker).
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

export interface RawProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  serviceName: string;
  orderId: number | null;
  quantity: number;
  price: number;
  notes: string | null;
}

export interface RawServiceCategoryRef {
  id: number;
  name: string;
}

export interface RawServiceCatalogItem {
  id: number;
  name: string;
  parentServiceId: number | null;
  categories?: RawServiceCategoryRef[];
  isActive: boolean;
}

interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ProviderServiceCreateInput {
  serviceId: number;
  quantity: number;
  price: number;
  notes?: string;
}

export interface ProviderServiceUpdateInput {
  quantity: number;
  price: number;
  notes?: string;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

/**
 * Normalises a `/provider-services` or `/Services` page envelope into
 * `PaginatedResponse`. Defensive against the live backend returning a bare
 * `data: []` (or `null`) instead of the `RawPage` shape for an empty result —
 * an empty list is a valid success, not something to throw on.
 */
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

/** Backend caps PageSize at 100 ("must be between 1 and 100") — do not raise without adding real pagination. */
const DEFAULT_PAGE_SIZE = 100;

export const providerServicesApi = {
  list: async (): Promise<PaginatedResponse<RawProviderService>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawProviderService> | RawProviderService[] | null>>(
      "/provider-services",
      { params: { PageNumber: 1, PageSize: DEFAULT_PAGE_SIZE } },
    );
    return fromRawPage(unwrap(data));
  },

  get: async (id: number): Promise<RawProviderService> => {
    const { data } = await apiClient.get<ApiEnvelope<RawProviderService>>(`/provider-services/${id}`);
    return unwrap(data);
  },

  create: async (input: ProviderServiceCreateInput): Promise<RawProviderService> => {
    const { data } = await apiClient.post<ApiEnvelope<RawProviderService>>("/provider-services", input);
    return unwrap(data);
  },

  update: async (id: number, input: ProviderServiceUpdateInput): Promise<RawProviderService> => {
    const { data } = await apiClient.put<ApiEnvelope<RawProviderService>>(`/provider-services/${id}`, input);
    return unwrap(data);
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/provider-services/${id}`);
  },

  getCatalog: async (): Promise<PaginatedResponse<RawServiceCatalogItem>> => {
    const { data } = await apiClient.get<
      ApiEnvelope<RawPage<RawServiceCatalogItem> | RawServiceCatalogItem[] | null>
    >("/Services", {
      params: { PageNumber: 1, PageSize: DEFAULT_PAGE_SIZE },
    });
    return fromRawPage(unwrap(data));
  },
};
