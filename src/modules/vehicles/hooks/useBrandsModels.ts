import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "../api/vehiclesApi";

/**
 * Cascading lookups for the Brand / Model / Year dropdowns.
 *
 * Each level is its own query — TanStack Query handles caching,
 * dedup, and the `enabled` flag short-circuits the chain when
 * a parent has not yet been picked. Result: the user sees an
 * empty disabled Model select until they pick a Brand, then
 * Models load, then Years unlock once a Model is selected.
 *
 * Cache keys are stable: e.g. visiting two vehicles that share
 * the same brand will reuse one network call for its models.
 */

const BRANDS_KEY = ["lookups", "brands"] as const;
const MODELS_KEY = (brandId: number | null) => ["lookups", "brands", brandId, "models"] as const;
const YEARS_KEY = (brandId: number | null, modelId: number | null) =>
  ["lookups", "brands", brandId, "models", modelId, "years"] as const;

/** Long staleTime — brands rarely change. */
const LOOKUP_STALE = 30 * 60_000;

export function useBrandsQuery() {
  return useQuery({
    queryKey: BRANDS_KEY,
    queryFn: () => vehiclesApi.brands(),
    staleTime: LOOKUP_STALE,
  });
}

export function useModelsQuery(brandId: number | null) {
  return useQuery({
    queryKey: MODELS_KEY(brandId),
    queryFn: () => vehiclesApi.modelsByBrand(brandId!),
    enabled: brandId != null && brandId > 0,
    staleTime: LOOKUP_STALE,
  });
}

export function useYearsQuery(brandId: number | null, modelId: number | null) {
  return useQuery({
    queryKey: YEARS_KEY(brandId, modelId),
    queryFn: () => vehiclesApi.yearsByModel(brandId!, modelId!),
    enabled: brandId != null && brandId > 0 && modelId != null && modelId > 0,
    staleTime: LOOKUP_STALE,
  });
}
