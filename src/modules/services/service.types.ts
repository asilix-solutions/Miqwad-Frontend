/**
 * @file service.types.ts
 * @description Domain types for the Service ENTITY — a self-join tree
 * (`parentServiceId`), distinct from the flat admin-managed `ServiceCategory`
 * in `types.ts` and from the legacy category-scoped `Service` also declared
 * there (`nameAr/nameEn/categoryId/basePrice`, consumed by
 * `adminApi.getServices`). Deliberately kept in its own file/type namespace
 * to avoid colliding with that legacy `Service` export — see
 * `serviceAdapter.ts` for the migration note and `README`/PR notes for the
 * naming cleanup this leaves for later.
 *
 * Backend model (per architect brief, no live Swagger section yet):
 *   Service { id, name, parentServiceId: number|null, isActive, createdAt }
 * linked to Category many-to-many via `/api/Categories/{id}/services`.
 */

/** Defensive raw shape — mirrors the expected backend contract. */
export interface RawService {
  id: number;
  name: string;
  parentServiceId?: number | null;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

/** A service taxonomy node (self-join tree), distinct from PricedService (the priced offering). */
export interface Service {
  id: number;
  name: string;
  parentServiceId: number | null;
  isActive: boolean;
  createdAt?: string;
  children?: Service[];
}
