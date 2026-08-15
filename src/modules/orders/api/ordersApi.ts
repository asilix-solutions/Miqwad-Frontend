/**
 * @file ordersApi.ts
 * @description Real-backend API layer for /api/Orders. Envelope-aware
 * (`{ success, message, data, errors }`), mirrors
 * src/modules/addresses/api/addressesApi.ts. READ returns type/status/
 * paymentMethod as string code-names; PUT expects the numeric codes (mapped
 * by the caller via lib/orderAdapter.ts before hitting `update`). No create
 * (POST) — orders are created by customers, not admins. PageSize capped at 100.
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

export interface RawOrder {
  id: number;
  userId: number;
  userFullName: string;
  type: string;
  status: string;
  paymentMethod: string;
  trackNumber: string;
  createdAt: string;
}

interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface OrderWritePayload {
  type: number;
  paymentMethod: number;
  status: number;
  trackNumber: string;
}

export interface OrdersListParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filterBy?: string;
  filterValue?: string;
  dateFilterBy?: string;
  fromDate?: string;
  toDate?: string;
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

export const ordersApi = {
  list: async (params: OrdersListParams = {}): Promise<PaginatedResponse<RawOrder>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawOrder> | RawOrder[] | null>>(
      "/Orders",
      {
        params: {
          PageNumber: params.pageNumber ?? 1,
          PageSize: Math.min(params.pageSize ?? DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE),
          SortBy: params.sortBy,
          SortDescending: params.sortDescending,
          FilterBy: params.filterBy,
          FilterValue: params.filterValue,
          DateFilterBy: params.dateFilterBy,
          FromDate: params.fromDate,
          ToDate: params.toDate,
        },
      },
    );
    return fromRawPage(unwrap(data));
  },

  get: async (id: string): Promise<RawOrder> => {
    const { data } = await apiClient.get<ApiEnvelope<RawOrder>>(`/Orders/${id}`);
    return unwrap(data);
  },

  update: async (id: string, payload: OrderWritePayload): Promise<RawOrder> => {
    const { data } = await apiClient.put<ApiEnvelope<RawOrder>>(`/Orders/${id}`, payload);
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Orders/${id}`);
  },
};
