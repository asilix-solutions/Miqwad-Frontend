/**
 * Discovery domain types — public-facing search for service providers,
 * provider profile (customer-side view), reviews, and favorites.
 *
 * Endpoints reference (per Swagger):
 *   GET    /services/nearby                    — nearby search
 *   GET    /ServiceProviders/{id}/profile      — provider profile (re-used)
 *   GET    /providers/{providerId}/services    — provider services (re-used)
 *
 * Endpoints required by MVP but not yet exposed by the Swagger
 * (built as mocks now, drop-in once the backend is ready):
 *   GET    /ServiceProviders/{id}/reviews?limit=&offset=
 *   GET    /favorites
 *   POST   /favorites/{providerId}
 *   DELETE /favorites/{providerId}
 */

/**
 * Single provider entry returned by the nearby search API. Combines
 * the public provider profile with computed distance/availability so
 * the card on the search page can render without a second fetch.
 */
export interface NearbyProvider {
  id: number;
  companyName: string;
  city: string | null;
  address: string | null;
  lat: number;
  lng: number;
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  /** Categories this provider covers — used by the chip strip on the card. */
  categoryIds: number[];
  /** Convenience: km from the user's search origin. */
  distanceKm: number;
  /** Cheapest service the provider offers — for the "starting from" tag. */
  priceFrom: number | null;
  /** Coarse "open now" flag — set by the mock based on workingHours. */
  isOpenNow: boolean;
}

/**
 * A provider's public offering, as returned by
 * `GET /api/public/provider-services?FilterBy=providerId&FilterValue={id}`.
 * Confirmed live contract (Dealer JWT probe): same row shape as the
 * provider's own `/api/provider-services` — the offering IS a priced
 * catalog service, so there is no independent categoryName/description/
 * estimatedDuration on the public side either.
 */
export interface PublicProviderService {
  id: number;
  providerId: number;
  serviceId: number;
  serviceName: string;
  quantity: number;
  price: number;
  notes: string | null;
}

/** Filters bound to the URL/Redux for the search page. */
export interface NearbySearchFilters {
  /** Search origin. null → "use my location" once we have it. */
  lat: number | null;
  lng: number | null;
  /** Search radius in kilometres. */
  radiusKm: number;
  /** Optional category filter — null means "any category". */
  categoryId: number | null;
  /** Minimum rating filter (0 = no filter). */
  minRating: 0 | 3 | 4 | 4.5;
  /** Price band. null = no filter. Hard-coded buckets for the UX. */
  priceBand: PriceBand | null;
  /** Restrict to providers open now. */
  openNowOnly: boolean;
  /** Plain-text query (matches company name). */
  q: string;
}

export type PriceBand = "lte_100" | "100_300" | "300_700" | "gt_700";

/** Single review entry. */
export interface ProviderReview {
  id: number;
  providerId: number;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ProviderReviewsResponse {
  total: number;
  averageRating: number;
  items: ProviderReview[];
}

/** Favorites are a thin mapping {userId, providerId} on the backend. */
export interface FavoriteEntry {
  providerId: number;
  createdAt: string;
}

/**
 * Default search radius in km — kept as a constant because both
 * the page UI and the URL-sync hooks need to agree on the default.
 */
export const DEFAULT_RADIUS_KM = 10;

/**
 * Saudi Arabia centroid (Riyadh) — fallback origin when the browser
 * geolocation API is unavailable or denied. Picked Riyadh as it has
 * the largest demo dataset.
 */
export const FALLBACK_ORIGIN = {
  lat: 24.7136,
  lng: 46.6753,
  city: "الرياض",
} as const;

/**
 * Curated list of Saudi cities for the city picker fallback.
 * Coordinates are city centres — accurate enough for distance display
 * and the demo seed data.
 */
export const KSA_CITIES: ReadonlyArray<{
  key: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
}> = [
  { key: "riyadh", nameAr: "الرياض", nameEn: "Riyadh", lat: 24.7136, lng: 46.6753 },
  { key: "jeddah", nameAr: "جدة", nameEn: "Jeddah", lat: 21.4858, lng: 39.1925 },
  { key: "dammam", nameAr: "الدمام", nameEn: "Dammam", lat: 26.4207, lng: 50.0888 },
  { key: "mecca", nameAr: "مكة المكرمة", nameEn: "Mecca", lat: 21.3891, lng: 39.8579 },
  { key: "medina", nameAr: "المدينة المنورة", nameEn: "Medina", lat: 24.5247, lng: 39.5692 },
  { key: "khobar", nameAr: "الخبر", nameEn: "Khobar", lat: 26.2172, lng: 50.1971 },
  { key: "taif", nameAr: "الطائف", nameEn: "Taif", lat: 21.2703, lng: 40.4158 },
  { key: "abha", nameAr: "أبها", nameEn: "Abha", lat: 18.2164, lng: 42.5053 },
];
