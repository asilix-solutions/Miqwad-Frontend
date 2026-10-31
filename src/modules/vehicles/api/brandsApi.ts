/**
 * @file brandsApi.ts
 * @description Transport layer for the REAL backend's `/api/Brands` resource
 * (admin master-detail: brands + their models). Distinct from
 * `vehiclesApi.brands()`/`modelsByBrand()` (`/Lookups/brands...`, mocked
 * lookups) which stay the source for the always-mocked `Lookups` prefix —
 * see `useBrandsModels.ts`, which now sources brand/model *reads* from this
 * file instead while keeping `/Lookups/.../years` unchanged.
 *
 * Not covered by any `ALWAYS_MOCKED_PREFIXES` entry (`admin/`,
 * `services/categories`, `lookups/brands`, `workshop/`, `scrap/`,
 * `dealer/`) or any mock handler's URL match — the bare `Brands` path used
 * here falls through to the real backend. See src/shared/mocks/server.ts.
 */
import { apiClient } from "@shared/lib/axios";
import type { Brand, VehicleModel } from "../types";
import type { PaginatedResponse } from "@shared/types/api";
import {
  adaptBrandsPage,
  adaptBrandToWritePayload,
  adaptModelsPage,
  adaptModelWrite,
  adaptRawBrand,
  adaptRawModel,
  type ApiEnvelope,
  type RawBrand,
  type RawModel,
  type RawPage,
} from "../lib/brandAdapter";

export interface BrandsQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filterValue?: string;
}

/** Only the create envelope is confirmed live; list/update/delete are assumed to match (see brandAdapter.ts header). */
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

/** PUT/DELETE may return 204 No Content with an empty body — treated as success without unwrapping. */
function unwrapVoid(status: number, body: ApiEnvelope<unknown> | "" | null | undefined): void {
  if (status === 204 || body === "" || body === null || body === undefined) return;
  unwrap(body);
}

function toQueryParams(params?: BrandsQuery) {
  return (
    params && {
      PageNumber: params.pageNumber,
      PageSize: params.pageSize,
      SortBy: params.sortBy,
      SortDescending: params.sortDescending,
      FilterValue: params.filterValue,
    }
  );
}

export const brandsApi = {
  list: async (params?: BrandsQuery): Promise<PaginatedResponse<Brand>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawBrand>>>("/Brands", {
      params: toQueryParams(params),
    });
    return adaptBrandsPage(unwrap(data));
  },

  get: async (id: number): Promise<Brand> => {
    const { data } = await apiClient.get<ApiEnvelope<RawBrand>>(`/Brands/${id}`);
    return adaptRawBrand(unwrap(data));
  },

  create: async (name: string, image?: File | Blob | string | null): Promise<Brand> => {
    const { data } = await apiClient.post<ApiEnvelope<RawBrand>>("/Brands", adaptBrandToWritePayload(name, image));
    return adaptRawBrand(unwrap(data));
  },

  update: async (id: number, name: string, image?: File | Blob | string | null): Promise<void> => {
    const { status, data } = await apiClient.put<ApiEnvelope<RawBrand> | "">(
      `/Brands/${id}`,
      adaptBrandToWritePayload(name, image),
    );
    unwrapVoid(status, data);
  },

  remove: async (id: number): Promise<void> => {
    const { status, data } = await apiClient.delete<ApiEnvelope<unknown> | "">(`/Brands/${id}`);
    unwrapVoid(status, data);
  },

  listModels: async (brandId: number, params?: BrandsQuery): Promise<PaginatedResponse<VehicleModel>> => {
    const { data } = await apiClient.get<ApiEnvelope<RawPage<RawModel>>>(`/Brands/${brandId}/models`, {
      params: toQueryParams(params),
    });
    return adaptModelsPage(unwrap(data), brandId);
  },

  /**
   * Complete data retrieval for brands across all pages.
   * - Queries with backend-max PageSize = 100.
   * - If totalPages > 1, retrieves remaining pages up to MAX_PAGES (safety bound = 50).
   * - Deduplicates records by stable brand ID.
   */
  listAll: async (params?: Omit<BrandsQuery, "pageNumber" | "pageSize">): Promise<Brand[]> => {
    const PAGE_SIZE = 100;
    const MAX_PAGES = 50;

    const firstPage = await brandsApi.list({ ...params, pageNumber: 1, pageSize: PAGE_SIZE });
    const allItems: Brand[] = [...firstPage.items];
    const totalPages = Math.min(Math.max(1, firstPage.totalPages || 1), MAX_PAGES);

    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        const nextPage = await brandsApi.list({ ...params, pageNumber: page, pageSize: PAGE_SIZE });
        allItems.push(...nextPage.items);
      }
    }

    const seen = new Set<number>();
    const result = allItems.filter((brand) => {
      if (seen.has(brand.id)) return false;
      seen.add(brand.id);
      return true;
    });

    if (firstPage.totalPages > MAX_PAGES) {
      console.warn(`[brandsApi.listAll] Safety limit reached: totalPages (${firstPage.totalPages}) > MAX_PAGES (${MAX_PAGES}).`);
      Object.defineProperty(result, "isTruncated", { value: true, enumerable: false, configurable: true });
      Object.defineProperty(result, "totalCount", { value: firstPage.total, enumerable: false, configurable: true });
    }

    return result;
  },

  /**
   * Complete data retrieval for a brand's models across all pages.
   * - Queries with backend-max PageSize = 100.
   * - If totalPages > 1, retrieves remaining pages up to MAX_PAGES (safety bound = 50).
   * - Deduplicates records by stable model ID.
   */
  listAllModels: async (brandId: number, params?: Omit<BrandsQuery, "pageNumber" | "pageSize">): Promise<VehicleModel[]> => {
    const PAGE_SIZE = 100;
    const MAX_PAGES = 50;

    const firstPage = await brandsApi.listModels(brandId, { ...params, pageNumber: 1, pageSize: PAGE_SIZE });
    const allItems: VehicleModel[] = [...firstPage.items];
    const totalPages = Math.min(Math.max(1, firstPage.totalPages || 1), MAX_PAGES);

    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        const nextPage = await brandsApi.listModels(brandId, { ...params, pageNumber: page, pageSize: PAGE_SIZE });
        allItems.push(...nextPage.items);
      }
    }

    const seen = new Set<number>();
    const result = allItems.filter((model) => {
      if (seen.has(model.id)) return false;
      seen.add(model.id);
      return true;
    });

    if (firstPage.totalPages > MAX_PAGES) {
      console.warn(`[brandsApi.listAllModels] Safety limit reached: totalPages (${firstPage.totalPages}) > MAX_PAGES (${MAX_PAGES}).`);
      Object.defineProperty(result, "isTruncated", { value: true, enumerable: false, configurable: true });
      Object.defineProperty(result, "totalCount", { value: firstPage.total, enumerable: false, configurable: true });
    }

    return result;
  },

  // ── Model writes — standalone /api/Models, confirmed live contract. ──────
  createModel: async (brandId: number, name: string): Promise<VehicleModel> => {
    const { data } = await apiClient.post<ApiEnvelope<RawModel>>("/Models", adaptModelWrite(name, brandId));
    return adaptRawModel(unwrap(data), brandId);
  },

  updateModel: async (brandId: number, modelId: number, name: string): Promise<void> => {
    const { status, data } = await apiClient.put<ApiEnvelope<RawModel> | "">(
      `/Models/${modelId}`,
      adaptModelWrite(name, brandId),
    );
    unwrapVoid(status, data);
  },

  removeModel: async (_brandId: number, modelId: number): Promise<void> => {
    const { status, data } = await apiClient.delete<ApiEnvelope<unknown> | "">(`/Models/${modelId}`);
    unwrapVoid(status, data);
  },
};

/**
 * Safely checks if a list returned by listAll or listAllModels hit the safety page limit.
 */
export function isCatalogTruncated(list: unknown): boolean {
  return Boolean(list && typeof list === "object" && (list as { isTruncated?: boolean }).isTruncated);
}
