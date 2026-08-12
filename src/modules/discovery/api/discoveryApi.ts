import { apiClient } from "@shared/lib/axios";
import type {
  FavoriteEntry,
  NearbyProvider,
  NearbySearchFilters,
  ProviderReviewsResponse,
  PublicProviderService,
} from "../types";
import type { ProviderProfile } from "@modules/providers/types";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

/**
 * Transport layer for the Discovery module.
 *
 * Endpoint shapes follow the .NET Swagger contract whenever an endpoint
 * exists. For endpoints not yet defined upstream (reviews, favorites)
 * we adopt the same naming conventions so the backend can adopt these
 * routes as-is. Once the API is live, flipping VITE_USE_MOCKS=false
 * is enough to switch the whole module over.
 */

export interface NearbySearchParams
  extends Omit<NearbySearchFilters, "lat" | "lng" | "radiusKm"> {
  lat: number;
  lng: number;
  radiusKm: number;
}

export const discoveryApi = {
  /**
   * GET /services/nearby — returns providers in a radius around (lat, lng),
   * filtered by the optional query params.
   */
  searchNearby: async (params: NearbySearchParams): Promise<NearbyProvider[]> => {
    const { data } = await apiClient.get<NearbyProvider[]>("/services/nearby", {
      params: {
        lat: params.lat,
        lng: params.lng,
        radiusKm: params.radiusKm,
        categoryId: params.categoryId ?? undefined,
        minRating: params.minRating || undefined,
        priceBand: params.priceBand ?? undefined,
        openNowOnly: params.openNowOnly || undefined,
        q: params.q || undefined,
      },
    });
    return data;
  },

  /**
   * GET /ServiceProviders/{id}/profile — re-uses the same endpoint the
   * provider area calls, but the customer view only needs a subset.
   */
  providerProfile: async (id: number): Promise<ProviderProfile> => {
    const { data } = await apiClient.get<ProviderProfile>(
      `/ServiceProviders/${id}/profile`,
    );
    return data;
  },

  /**
   * GET /public/provider-services?FilterBy=providerId&FilterValue={id} —
   * the provider's priced offerings, read-only from the customer
   * perspective. Confirmed live contract (Dealer JWT probe): standard
   * `{ success, message, data, errors }` envelope wrapping a
   * `PaginatedResponse`-shaped page.
   */
  providerServices: async (providerId: number): Promise<PublicProviderService[]> => {
    const { data } = await apiClient.get<
      ApiEnvelope<{ items: PublicProviderService[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number }>
    >("/public/provider-services", {
      params: { FilterBy: "providerId", FilterValue: providerId },
    });
    return unwrap(data).items;
  },

  /**
   * GET /ServiceProviders/{id}/reviews — paginated reviews.
   * Not yet in the Swagger; backend will mirror this shape when ready.
   */
  providerReviews: async (
    providerId: number,
    params: { limit?: number; offset?: number } = {},
  ): Promise<ProviderReviewsResponse> => {
    const { data } = await apiClient.get<ProviderReviewsResponse>(
      `/ServiceProviders/${providerId}/reviews`,
      {
        params: {
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
        },
      },
    );
    return data;
  },

  /** GET /favorites — favorites for the current user. */
  listFavorites: async (): Promise<FavoriteEntry[]> => {
    const { data } = await apiClient.get<FavoriteEntry[]>("/favorites");
    return data;
  },

  /** POST /favorites/{providerId} — add a provider to favorites. */
  addFavorite: async (providerId: number): Promise<FavoriteEntry> => {
    const { data } = await apiClient.post<FavoriteEntry>(`/favorites/${providerId}`);
    return data;
  },

  /** DELETE /favorites/{providerId} — remove a provider from favorites. */
  removeFavorite: async (providerId: number): Promise<{ success: true }> => {
    const { data } = await apiClient.delete<{ success: true }>(
      `/favorites/${providerId}`,
    );
    return data;
  },
};
