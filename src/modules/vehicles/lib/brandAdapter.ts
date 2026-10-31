/**
 * @file brandAdapter.ts
 * @description Single translation boundary between the real `/api/Brands`
 * backend and the internal `Brand` / `VehicleModel` models used across the
 * vehicle lookups (`BrandModelYearSelect`) and the admin Brands & Models
 * master-detail UI.
 *
 * Confirmed live contract (2026-08-06 probe):
 *  - `POST /api/Brands` → 201 + `{ id, name, image, createdAt, models: [] }`.
 *  - Response envelope: `{ success, message, data, errors }`.
 *  - `GET /api/Brands/{brandId}/models` is paginated
 *    (`items/pageNumber/pageSize/totalCount/totalPages`).
 *  - Model item shape assumed `{ id, name, brandId?, ... }`, mirroring Brand.
 *
 * Model write contract (confirmed live, 2026-08-06): standalone `/api/Models`,
 * NOT nested under the brand — `POST /api/Models` and `PUT/DELETE
 * /api/Models/{id}`, body `{ name, brandId }`. Reads stay on the confirmed
 * `GET /api/Brands/{brandId}/models`.
 */
import type { Brand, VehicleModel } from "../types";
import type { PaginatedResponse } from "@shared/types/api";
import { getModelArabicNameById, getModelArabicNameByBrand } from "./modelLocalization";

export interface RawBrand {
  id: number;
  name: string;
  image?: string | null;
  createdAt?: string;
  models?: RawModel[];
  [key: string]: unknown;
}

export interface RawModel {
  id: number;
  name: string;
  brandId?: number;
  [key: string]: unknown;
}

export interface RawPage<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
}

/** Adapts one raw backend brand into the internal `Brand` shape. Never throws. */
export function adaptRawBrand(raw: RawBrand): Brand {
  return {
    id: raw.id,
    name: raw.name ?? "",
    image: raw.image ?? null,
    createdAt: raw.createdAt,
  };
}

/**
 * Adapts one raw backend model. `brandId` falls back to the parent brand id
 * passed by the caller when the item itself doesn't carry one (list is
 * already scoped to a brand via the URL).
 */
export function adaptRawModel(raw: RawModel, brandId: number | null = null): VehicleModel {
  const modelId = raw.id;
  const name = raw.name ?? "";
  const resolvedBrandId = raw.brandId ?? brandId;
  const nameAr =
    getModelArabicNameById(modelId) ??
    (resolvedBrandId ? getModelArabicNameByBrand(resolvedBrandId, name) : undefined);

  return {
    id: modelId,
    name,
    brandId: resolvedBrandId,
    nameAr,
  };
}

export function adaptBrandsPage(raw: RawPage<RawBrand>): PaginatedResponse<Brand> {
  const items = Array.isArray(raw.items) ? raw.items.map(adaptRawBrand) : [];
  const page = raw.pageNumber ?? 1;
  const pageSize = raw.pageSize ?? 100;
  const total = raw.totalCount ?? items.length;
  const totalPages =
    raw.totalPages ?? (total > 0 ? Math.ceil(total / Math.max(1, pageSize)) : 1);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function adaptModelsPage(raw: RawPage<RawModel>, brandId: number): PaginatedResponse<VehicleModel> {
  const items = Array.isArray(raw.items) ? raw.items.map((m) => adaptRawModel(m, brandId)) : [];
  const page = raw.pageNumber ?? 1;
  const pageSize = raw.pageSize ?? 100;
  const total = raw.totalCount ?? items.length;
  const totalPages =
    raw.totalPages ?? (total > 0 ? Math.ceil(total / Math.max(1, pageSize)) : 1);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
  };
}

/** Builds the create/update multipart request body for a brand, matching the verified live backend contract (`Name`, optional `ImageFile`). */
export function adaptBrandToWritePayload(name: string, image?: File | Blob | string | null): FormData {
  const formData = new FormData();
  formData.append("Name", name);
  if (image instanceof Blob) {
    formData.append("ImageFile", image);
  }
  return formData;
}

/** Builds the create/update request body for the standalone `/api/Models` endpoint. */
export function adaptModelWrite(name: string, brandId: number): { name: string; brandId: number } {
  return { name, brandId };
}
