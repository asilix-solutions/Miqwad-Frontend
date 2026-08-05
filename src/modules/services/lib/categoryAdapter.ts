/**
 * @file categoryAdapter.ts
 * @description Single translation boundary between the real `/api/Categories`
 * backend (parent / level-1 categories only) and the internal flat
 * `ServiceCategory` model shared across admin/provider/dealer UIs.
 * Sub-categories (L2/L3) are entirely unaffected by this file — they keep
 * coming from the mocked `/Services/categories` tree.
 *
 * Confirmed live contract (miqwad-test.runasp.net Swagger + a live
 * `POST /api/Categories` probe, 2026-08-04):
 *  - Response envelope: `{ success, message, data: { items, pageNumber,
 *    pageSize, totalCount, totalPages }, errors }`.
 *  - `CreateCategoryDto` / `UpdateCategoryDto`: `{ name: string }` only.
 *  - `id` path param is `integer(int64)` — numeric, not a string.
 *  - The DTOs carry no `parentId`/hierarchy concept at all: `/api/Categories`
 *    is a flat, single-level resource. It always maps to internal level 1.
 */
import type { ServiceCategory } from "@modules/services/types";
import type { PaginatedResponse } from "@shared/types/api";

export interface RawCategory {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface RawCategoriesPage {
  items: RawCategory[];
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

/**
 * Adapts one raw backend category into the internal flat ServiceCategory
 * shape. Never throws — falls back to empty/neutral values so a malformed
 * item can't crash the tree render.
 *
 * NOTE: `id` is kept as the backend's numeric id (not stringified) because
 * `ServiceCategory.id`/`parentId` are `number` throughout the codebase and
 * that type is intentionally left unchanged by this integration. Mock
 * category ids currently live in the 100+ range (seeds) and 400+ range
 * (dynamically created) — a real backend id could theoretically collide
 * with those ranges once enough real categories exist. Revisit with an id
 * namespace/offset if that ever becomes a real collision, not before.
 *
 * `nameAr`/`nameEn` are both mirrors of the single backend `name` — the
 * internal `ServiceCategory` model keeps bilingual fields for shared
 * consumers, but the real backend contract itself only ever carries `name`.
 */
export function adaptRawCategory(raw: RawCategory): ServiceCategory {
  return {
    id: raw.id,
    nameAr: raw.name ?? "",
    nameEn: raw.name ?? "",
    iconUrl: null,
    colorHint: undefined,
    parentId: null,
    level: 1,
    providerTypeScope: null,
    isActive: true,
    sortOrder: 0,
  };
}

export function adaptCategoriesPage(raw: RawCategoriesPage): PaginatedResponse<ServiceCategory> {
  return {
    items: raw.items.map(adaptRawCategory),
    page: raw.pageNumber,
    pageSize: raw.pageSize,
    total: raw.totalCount,
    totalPages: raw.totalPages,
  };
}

/** Builds the create/update request body from the single Arabic name the UI collects. */
export function adaptToWritePayload(name: string): { name: string } {
  return { name };
}
