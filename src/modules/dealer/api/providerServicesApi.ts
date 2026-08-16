/**
 * @file providerServicesApi.ts
 * @description Transport layer for the dealer "products" flow, which is a
 * thin wrapper around the admin service catalog — no free-standing product
 * entity exists. Confirmed live contract (Dealer JWT probe, token-stripped):
 *  - Envelope: `{ success, message, data, errors }` on every response.
 *  - `POST/GET/PUT/DELETE /api/provider-services` — the dealer's own
 *    offerings, caller-scoped by the backend from the JWT. `providerId` and
 *    `orderId` are server-derived and must never be sent on write.
 *  - `GET /api/Services` — the admin-managed service catalog (Dealer-403 on
 *    `/api/Categories` and `/Services/{id}/children`, so this list endpoint
 *    is the only source for the picker).
 *  - `POST/PUT /api/provider-services` are now **multipart/form-data**
 *    (2026-08 update): `ServiceId, Quantity, Price, Notes,
 *    IsCompatibleWith, Files[]`. `Price` must be an integer string — the
 *    live binder rejects decimal strings under multipart; this is a
 *    confirmed backend limitation, not a frontend choice. `Files` on PUT is
 *    additive only — there is no confirmed image-removal path (the
 *    attachments DELETE returned 401 for the owning dealer), so the UI must
 *    not offer one.
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

/** One image ref on a `ProviderService`, shaped like the confirmed `/api/attachments` DTO. */
export interface RawProviderServiceAttachment {
  id: number;
  originalFileName?: string | null;
  filePath?: string | null;
  contentType?: string | null;
  [key: string]: unknown;
}

export interface RawProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  serviceName: string;
  orderId: number | null;
  quantity: number;
  price: number;
  notes: string | null;
  isCompatibleWith?: string | null;
  attachments?: RawProviderServiceAttachment[] | null;
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
  isCompatibleWith?: string;
  files?: File[];
}

export interface ProviderServiceUpdateInput {
  quantity: number;
  price: number;
  notes?: string;
  isCompatibleWith?: string;
  /** Additive only — appended to whatever images the row already has. */
  files?: File[];
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

/** Builds the shared multipart body for create/update — `serviceId` only present on create. */
function buildProviderServiceForm(
  input: ProviderServiceCreateInput | ProviderServiceUpdateInput,
  serviceId?: number,
): FormData {
  const form = new FormData();
  if (serviceId != null) form.append("ServiceId", String(serviceId));
  form.append("Quantity", String(input.quantity));
  // Confirmed live: the multipart binder rejects non-integer Price strings.
  form.append("Price", String(Math.round(input.price)));
  if (input.notes) form.append("Notes", input.notes);
  if (input.isCompatibleWith) form.append("IsCompatibleWith", input.isCompatibleWith);
  for (const file of input.files ?? []) form.append("Files", file);
  return form;
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
    const form = buildProviderServiceForm(input, input.serviceId);
    const { data } = await apiClient.post<ApiEnvelope<RawProviderService>>("/provider-services", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(data);
  },

  update: async (id: number, input: ProviderServiceUpdateInput): Promise<RawProviderService> => {
    const form = buildProviderServiceForm(input);
    const { data } = await apiClient.put<ApiEnvelope<RawProviderService>>(`/provider-services/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
