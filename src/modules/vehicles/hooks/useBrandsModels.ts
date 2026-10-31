import { useQuery } from "@tanstack/react-query";
import { vehiclesApi } from "../api/vehiclesApi";
import { brandsApi } from "../api/brandsApi";

/**
 * Cascading lookups for the Brand / Model / Year dropdowns, plus the query
 * keys shared with the admin Brands & Models mutations.
 *
 * Brand and Model reads now come from the real `/api/Brands` backend
 * (`brandsApi`) instead of the mocked `/Lookups/brands...`; Years stay on
 * the mocked lookup since brand/model management doesn't cover years. Each
 * level is its own query — TanStack Query handles caching, dedup, and the
 * `enabled` flag short-circuits the chain when a parent has not yet been
 * picked.
 */

export const brandKeys = {
  all: ["brands"] as const,
  list: () => [...brandKeys.all, "list"] as const,
  models: (brandId: number | null) => [...brandKeys.all, brandId, "models"] as const,
};

const YEARS_KEY = (brandId: number | null, modelId: number | null) =>
  ["lookups", "brands", brandId, "models", modelId, "years"] as const;

/** Long staleTime — brands rarely change. */
const LOOKUP_STALE = 30 * 60_000;


export function useBrandsQuery() {
  return useQuery({
    queryKey: brandKeys.list(),
    queryFn: () => brandsApi.listAll(),
    staleTime: LOOKUP_STALE,
  });
}

export function useModelsQuery(brandId: number | null) {
  return useQuery({
    queryKey: brandKeys.models(brandId),
    queryFn: () => brandsApi.listAllModels(brandId!),
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
