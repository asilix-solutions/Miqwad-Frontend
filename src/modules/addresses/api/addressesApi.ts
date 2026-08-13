/**
 * @file addressesApi.ts
 * @description Real-backend API layer for /api/Addresses. Envelope-aware
 * (`{ success, message, data, errors }`), mirrors the pattern established in
 * src/modules/dealer/api/providerServicesApi.ts. `userId` is auto-set by the
 * backend from the JWT on create — never sent from the client. PageSize is
 * capped at 100 by the backend (200 → 400).
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

export interface RawAddress {
  id: number;
  userId: number;
  title: string;
  description: string;
  shortNumber: string;
  longitude: number;
  latitude: number;
  createdAt: string;
}

interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AddressWritePayload {
  title: string;
  description: string;
  shortNumber: string;
  longitude: number;
  latitude: number;
}

export interface AddressesListParams {
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

export const addressesApi = {
  list: async (params: AddressesListParams = {}): Promise<PaginatedResponse<RawAddress>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawAddress> | RawAddress[] | null>>(
      "/Addresses",
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

  get: async (id: string): Promise<RawAddress> => {
    const { data } = await apiClient.get<ApiEnvelope<RawAddress>>(`/Addresses/${id}`);
    return unwrap(data);
  },

  create: async (payload: AddressWritePayload): Promise<RawAddress> => {
    const { data } = await apiClient.post<ApiEnvelope<RawAddress>>("/Addresses", payload);
    return unwrap(data);
  },

  update: async (id: string, payload: AddressWritePayload): Promise<RawAddress> => {
    const { data } = await apiClient.put<ApiEnvelope<RawAddress>>(`/Addresses/${id}`, payload);
    return unwrap(data);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/Addresses/${id}`);
  },
};
