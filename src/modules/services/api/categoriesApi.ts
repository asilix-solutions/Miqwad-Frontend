/**
 * @file categoriesApi.ts
 * @description Transport layer for the REAL backend's flat parent-category
 * endpoint (`/api/Categories`) — level-1 admin categories only. Distinct
 * from `servicesApi.categories()` (`/Services/categories`, mocked, all
 * levels) which stays the source for L2/L3 children.
 *
 * Not covered by any `ALWAYS_MOCKED_PREFIXES` entry (`admin/`,
 * `services/categories`, `lookups/brands`, `workshop/`, `scrap/`,
 * `dealer/`) or any mock handler's URL match (all are exact-string/regex
 * matches on `Services/categories` / `admin/categories`, distinct from the
 * bare `Categories` path used here) — requests naturally fall through to
 * the real backend. See src/shared/mocks/server.ts.
 */
import { apiClient } from "@shared/lib/axios";
import type { ServiceCategory } from "@modules/services/types";
import type { PaginatedResponse } from "@shared/types/api";
import {
  adaptCategoriesPage,
  adaptRawCategory,
  adaptToWritePayload,
  type ApiEnvelope,
  type RawCategoriesPage,
  type RawCategory,
} from "../lib/categoryAdapter";

export interface ParentCategoriesQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filterValue?: string;
}

/**
 * Only the list envelope is confirmed live (empty-data probe against the
 * test backend). Create/update/delete responses are assumed to follow the
 * same `{ success, message, data, errors }` envelope as every other real
 * endpoint in this codebase (see audit.adapter.ts) but are unconfirmed —
 * if the live test shows otherwise, this function is the only place to fix.
 */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

export const categoriesApi = {
  list: async (params?: ParentCategoriesQuery): Promise<PaginatedResponse<ServiceCategory>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawCategoriesPage>>("/Categories", {
      params: params && {
        PageNumber: params.pageNumber,
        PageSize: params.pageSize,
        SortBy: params.sortBy,
        SortDescending: params.sortDescending,
        FilterValue: params.filterValue,
      },
    });
    return adaptCategoriesPage(unwrap(data));
  },

  get: async (id: number): Promise<ServiceCategory> => {
    const { data } = await apiClient.get<ApiEnvelope<RawCategory>>(`/Categories/${id}`);
    return adaptRawCategory(unwrap(data));
  },

  create: async (name: string): Promise<ServiceCategory> => {
    const { data } = await apiClient.post<ApiEnvelope<RawCategory>>("/Categories", adaptToWritePayload(name));
    return adaptRawCategory(unwrap(data));
  },

  update: async (id: number, name: string): Promise<ServiceCategory> => {
    const { data } = await apiClient.put<ApiEnvelope<RawCategory>>(`/Categories/${id}`, adaptToWritePayload(name));
    return adaptRawCategory(unwrap(data));
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/Categories/${id}`);
  },
};
