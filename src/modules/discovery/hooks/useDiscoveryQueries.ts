import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@app/store";
import { discoveryApi, type NearbySearchParams } from "../api/discoveryApi";
import type { NearbySearchFilters } from "../types";

/**
 * TanStack Query hooks for the Discovery module.
 * Query keys are short prefixes — see `queryClient.ts` for invalidation rules.
 */

/**
 * Nearby search — only fires when a valid origin has been resolved.
 * `enabled` prevents API calls before geolocation completes.
 */
export function useNearbySearchQuery(filters: NearbySearchFilters) {
  const valid =
    filters.lat != null &&
    filters.lng != null &&
    Number.isFinite(filters.lat) &&
    Number.isFinite(filters.lng);

  const params: NearbySearchParams | null = valid
    ? {
        lat: filters.lat as number,
        lng: filters.lng as number,
        radiusKm: filters.radiusKm,
        categoryId: filters.categoryId,
        minRating: filters.minRating,
        priceBand: filters.priceBand,
        openNowOnly: filters.openNowOnly,
        q: filters.q,
      }
    : null;

  return useQuery({
    queryKey: ["discovery", "nearby", params],
    queryFn: () => discoveryApi.searchNearby(params as NearbySearchParams),
    enabled: valid,
    staleTime: 60_000,
  });
}

/** Provider's public profile (re-uses `/ServiceProviders/{id}/profile`). */
export function usePublicProviderQuery(id: number) {
  return useQuery({
    queryKey: ["discovery", "provider", id],
    queryFn: () => discoveryApi.providerProfile(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60_000,
  });
}

/** Provider services (read-only customer view). */
export function usePublicProviderServicesQuery(id: number) {
  return useQuery({
    queryKey: ["discovery", "provider", id, "services"],
    queryFn: () => discoveryApi.providerServices(id),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60_000,
  });
}

/** Provider reviews — first page (10 most recent). */
export function useProviderReviewsQuery(id: number) {
  return useQuery({
    queryKey: ["discovery", "provider", id, "reviews"],
    queryFn: () => discoveryApi.providerReviews(id, { limit: 10, offset: 0 }),
    enabled: Number.isFinite(id) && id > 0,
    staleTime: 60_000,
  });
}

/** Current user's favorites (fetches once + cache invalidations). */
export function useFavoritesQuery() {
  const user = useAppSelector((s) => s.auth.user);
  return useQuery({
    queryKey: ["discovery", "favorites"],
    queryFn: discoveryApi.listFavorites,
    enabled: !!user,
    staleTime: 60_000,
  });
}

/** Add favorite — optimistic update via the slice via the page. */
export function useAddFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: number) => discoveryApi.addFavorite(providerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["discovery", "favorites"] });
    },
  });
}

/** Remove favorite. */
export function useRemoveFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (providerId: number) => discoveryApi.removeFavorite(providerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["discovery", "favorites"] });
    },
  });
}
