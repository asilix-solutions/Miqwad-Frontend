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

  create: async (name: string, image?: string | null): Promise<Brand> => {
    const { data } = await apiClient.post<ApiEnvelope<RawBrand>>("/Brands", adaptBrandToWritePayload(name, image));
    return adaptRawBrand(unwrap(data));
  },

  update: async (id: number, name: string, image?: string | null): Promise<void> => {
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
