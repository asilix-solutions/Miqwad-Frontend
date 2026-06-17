import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type {
  FavoriteEntry,
  NearbyProvider,
  PriceBand,
  ProviderReview,
  ProviderReviewsResponse,
} from "@modules/discovery/types";
import type { ProviderProfile, ProviderService } from "@modules/providers/types";

/**
 * In-process mock for Sprint 4 — Discover Nearby Services.
 *
 * Endpoints mocked:
 *   GET    /services/nearby?lat=&lng=&radiusKm=&...   — nearby search
 *   GET    /ServiceProviders/{id}/reviews             — paginated reviews
 *   GET    /favorites                                  — current user's favorites
 *   POST   /favorites/{providerId}                    — add favorite
 *   DELETE /favorites/{providerId}                    — remove favorite
 *
 * Existing endpoints reused (handled by providers.handlers.ts):
 *   GET    /ServiceProviders/{id}/profile
 *   GET    /providers/{providerId}/services
 *
 * State is persisted in localStorage so the demo survives reloads.
 * - Reviews live in their own keyed db (per provider).
 * - Favorites live in a keyed-by-userId db.
 * - Extra demo providers ("nearby seed") are appended into the same
 *   `maqwad.mockProvidersDb` blob that the providers handler owns,
 *   so the data is coherent across both modules.
 */

const REVIEWS_DB_KEY = "maqwad.mockReviewsDb";
const FAVORITES_DB_KEY = "maqwad.mockFavoritesDb";
const PROVIDERS_DB_KEY = "maqwad.mockProvidersDb";
const NEARBY_SEED_KEY = "maqwad.mockNearbySeeded";

// =============================================================================
// Shared types — mirrored from providers.handlers.ts on purpose.
// We intentionally don't import them: keeping the contract documented
// here makes the handler readable in isolation and avoids a cross-handler
// dependency cycle.
// =============================================================================

interface ProvidersDb {
  providers: Record<number, ProviderProfile>;
  services: Record<number, ProviderService>;
  nextProviderId: number;
  nextServiceId: number;
  seeded: boolean;
}

interface ReviewsDb {
  reviews: ProviderReview[];
  nextId: number;
  seeded: boolean;
}

interface FavoritesDb {
  /** keyed by userId → list of providerIds */
  byUser: Record<string, number[]>;
}

interface CurrentUser {
  id: string;
  phoneNumber: string;
  role: "customer" | "provider" | "driver" | "admin";
}

// =============================================================================
// Helpers
// =============================================================================

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string) {
  const err = new Error(message) as Error & {
    isAxiosError: boolean;
    response: AxiosResponse;
    config: InternalAxiosRequestConfig;
  };
  err.isAxiosError = true;
  err.config = config;
  err.response = {
    data: { code, message },
    status,
    statusText: "Error",
    headers: new AxiosHeaders(),
    config,
  };
  return err;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function readCurrentUser(): CurrentUser | null {
  return readJson<CurrentUser | null>("maqwad.user", null);
}

function readProvidersDb(): ProvidersDb {
  return readJson<ProvidersDb>(PROVIDERS_DB_KEY, {
    providers: {},
    services: {},
    nextProviderId: 1,
    nextServiceId: 1,
    seeded: false,
  });
}

function saveProvidersDb(db: ProvidersDb): void {
  writeJson(PROVIDERS_DB_KEY, db);
}

function readReviewsDb(): ReviewsDb {
  return readJson<ReviewsDb>(REVIEWS_DB_KEY, {
    reviews: [],
    nextId: 1,
    seeded: false,
  });
}

function saveReviewsDb(db: ReviewsDb): void {
  writeJson(REVIEWS_DB_KEY, db);
}

function readFavoritesDb(): FavoritesDb {
  return readJson<FavoritesDb>(FAVORITES_DB_KEY, { byUser: {} });
}

function saveFavoritesDb(db: FavoritesDb): void {
  writeJson(FAVORITES_DB_KEY, db);
}

/**
 * Haversine distance in km between two lat/lng points.
 * Good enough for the demo and what the backend will compute server-side.
 */
function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function priceBandIncludes(price: number | null, band: PriceBand): boolean {
  if (price == null) return false;
  switch (band) {
    case "lte_100":
      return price <= 100;
    case "100_300":
      return price > 100 && price <= 300;
    case "300_700":
      return price > 300 && price <= 700;
    case "gt_700":
      return price > 700;
  }
}

/**
 * Coarse "open now" detector — the demo `workingHours` field is a free
 * text label so we approximate with weekday/hour heuristics. The backend
 * will replace this with its own structured logic.
 */
function isOpenNow(workingHours: string | null): boolean {
  if (!workingHours) return false;
  const now = new Date();
  const hour = now.getHours();
  // "كل يوم" → 24/7
  if (workingHours.includes("كل يوم")) return hour >= 6 && hour < 24;
  // Default workshop pattern 8am–10pm
  return hour >= 8 && hour < 22;
}

// =============================================================================
// Seed — extra providers (so /services/nearby has interesting data).
// =============================================================================

const NEARBY_SEEDS: Array<Omit<ProviderProfile, "id">> = [
  {
    userId: "seed_nearby_1",
    companyName: "ورشة العاصمة لخدمات السيارات",
    type: "workshop",
    email: "asma@asema-workshop.sa",
    phone: "501110010",
    lat: 24.7400,
    lng: 46.7110,
    address: "حي السليمانية، شارع التحلية، الرياض",
    city: "الرياض",
    workingHours: "السبت — الخميس 8 ص — 10 م",
    rating: 4.7,
    totalRatings: 215,
    isVerified: true,
    status: "approved",
    categoryIds: [1, 4, 7],
    specialization: "ميكانيكا/صيانة عامة",
    photos: ["https://picsum.photos/seed/nb1a/400/300", "https://picsum.photos/seed/nb1b/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_2",
    companyName: "مركز السرعة للزيوت",
    type: "workshop",
    email: "support@speed-oil.sa",
    phone: "501110011",
    lat: 24.6950,
    lng: 46.6400,
    address: "طريق الملك عبدالعزيز، الرياض",
    city: "الرياض",
    workingHours: "كل يوم 7 ص — 11 م",
    rating: 4.4,
    totalRatings: 89,
    isVerified: true,
    status: "approved",
    categoryIds: [1, 6],
    specialization: "تغيير زيت/بطاريات",
    photos: ["https://picsum.photos/seed/nb2a/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_3",
    companyName: "مغسلة برق الرياض",
    type: "workshop",
    email: "info@barq-wash.sa",
    phone: "501110012",
    lat: 24.7800,
    lng: 46.7300,
    address: "حي الياسمين، الرياض",
    city: "الرياض",
    workingHours: "كل يوم 6 ص — 12 م",
    rating: 4.1,
    totalRatings: 56,
    isVerified: true,
    status: "approved",
    categoryIds: [8],
    specialization: "غسيل وتلميع",
    photos: ["https://picsum.photos/seed/nb3a/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_4",
    companyName: "كراج النخبة للسمكرة والدهان",
    type: "workshop",
    email: "ops@nokhba-bodyshop.sa",
    phone: "501110013",
    lat: 24.7050,
    lng: 46.7500,
    address: "حي النخيل، الرياض",
    city: "الرياض",
    workingHours: "السبت — الخميس 8 ص — 9 م",
    rating: 4.8,
    totalRatings: 312,
    isVerified: true,
    status: "approved",
    categoryIds: [9, 7],
    specialization: "سمكرة/دهان",
    photos: ["https://picsum.photos/seed/nb4a/400/300", "https://picsum.photos/seed/nb4b/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_5",
    companyName: "سطحة الراحة 24 ساعة",
    type: "workshop",
    email: "hello@raha-towing.sa",
    phone: "501110014",
    lat: 24.7200,
    lng: 46.7000,
    address: "خدمة متنقلة في الرياض",
    city: "الرياض",
    workingHours: "كل يوم 24 ساعة",
    rating: 4.3,
    totalRatings: 174,
    isVerified: true,
    status: "approved",
    categoryIds: [10],
    specialization: "سحب/خدمات طريق",
    photos: ["https://picsum.photos/seed/nb5a/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_6",
    companyName: "مركز التكييف الذهبي",
    type: "workshop",
    email: "info@gold-ac.sa",
    phone: "501110015",
    lat: 21.5400,
    lng: 39.1700,
    address: "حي الروضة، جدة",
    city: "جدة",
    workingHours: "السبت — الخميس 9 ص — 11 م",
    rating: 4.6,
    totalRatings: 142,
    isVerified: true,
    status: "approved",
    categoryIds: [5, 2],
    specialization: "تكييف/كهرباء",
    photos: ["https://picsum.photos/seed/nb6a/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
  {
    userId: "seed_nearby_7",
    companyName: "ورشة الواحة للكفرات",
    type: "workshop",
    email: "tires@waha.sa",
    phone: "501110016",
    lat: 26.4350,
    lng: 50.1050,
    address: "حي الشاطئ، الدمام",
    city: "الدمام",
    workingHours: "السبت — الخميس 8 ص — 10 م",
    rating: 4.2,
    totalRatings: 67,
    isVerified: true,
    status: "approved",
    categoryIds: [3],
    specialization: "كفرات/ميزانية",
    photos: ["https://picsum.photos/seed/nb7a/400/300"],
    documents: [],
    rejectionReason: null,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Sample services for the nearby seed providers so the "priceFrom"
 * tag is populated and the customer can drill into provider details.
 */
const NEARBY_SERVICES_BY_USER_ID: Record<string, Array<Omit<ProviderService, "id" | "providerId">>> = {
  seed_nearby_1: [
    {
      name: "تغيير زيت + فلتر",
      description: "زيت محرك أصلي + فلتر زيت",
      price: 220,
      estimatedDuration: 30,
      categoryId: 1,
      subcategoryId: 101,
      categoryName: "تغيير الزيت",
      subcategoryName: "تغيير زيت محرك",
    },
    {
      name: "صيانة 10,000 كم",
      description: "فحص شامل لجميع السوائل والفلاتر",
      price: 480,
      estimatedDuration: 90,
      categoryId: 4,
      subcategoryId: 401,
      categoryName: "الصيانة الدورية",
      subcategoryName: "صيانة 10,000 كم",
    },
  ],
  seed_nearby_2: [
    {
      name: "تغيير زيت سريع",
      description: "في أقل من 15 دقيقة بدون انتظار",
      price: 95,
      estimatedDuration: 15,
      categoryId: 1,
      subcategoryId: 101,
      categoryName: "تغيير الزيت",
      subcategoryName: "تغيير زيت محرك",
    },
  ],
  seed_nearby_3: [
    {
      name: "غسيل خارجي",
      description: "غسيل بالضغط + تجفيف",
      price: 40,
      estimatedDuration: 20,
      categoryId: 8,
      subcategoryId: 801,
      categoryName: "غسيل وتلميع",
      subcategoryName: "غسيل خارجي",
    },
    {
      name: "تلميع شامل",
      description: "غسيل + تلميع + تشميع",
      price: 320,
      estimatedDuration: 90,
      categoryId: 8,
      subcategoryId: 802,
      categoryName: "غسيل وتلميع",
      subcategoryName: "تلميع شامل",
    },
  ],
  seed_nearby_4: [
    {
      name: "إصلاح صدمة جانبية",
      description: "سمكرة + دهان مطابق للون السيارة",
      price: 850,
      estimatedDuration: 480,
      categoryId: 9,
      subcategoryId: 902,
      categoryName: "السمكرة والدهان",
      subcategoryName: "دهان قطعة",
    },
  ],
  seed_nearby_5: [
    {
      name: "سحب سيارة معطّلة",
      description: "خدمة 24 ساعة داخل الرياض",
      price: 250,
      estimatedDuration: 60,
      categoryId: 10,
      subcategoryId: 1001,
      categoryName: "خدمات على الطريق",
      subcategoryName: "سحب سيارة معطّلة",
    },
  ],
  seed_nearby_6: [
    {
      name: "تعبئة فريون التكييف",
      description: "تعبئة كاملة + فحص دائرة التبريد",
      price: 280,
      estimatedDuration: 60,
      categoryId: 5,
      subcategoryId: 501,
      categoryName: "تكييف وتبريد",
      subcategoryName: "تعبئة فريون",
    },
  ],
  seed_nearby_7: [
    {
      name: "ميزانية وعدلية إطارات",
      description: "ضبط زوايا الإطارات لقيادة آمنة",
      price: 140,
      estimatedDuration: 45,
      categoryId: 3,
      subcategoryId: 302,
      categoryName: "الكفرات",
      subcategoryName: "ميزانية وعدلية",
    },
  ],
};

function seedNearbyIfNeeded(): void {
  if (localStorage.getItem(NEARBY_SEED_KEY)) return;
  const db = readProvidersDb();

  // Make sure the base seed runs first (handled by providers.handlers.ts
  // when its `tryProvidersMock` is invoked — but if the user lands on
  // /app/services/nearby before any provider call, db may be empty).
  // We still append our nearby seeds either way; uniqueness is guarded
  // by userId.

  const existingUserIds = new Set(Object.values(db.providers).map((p) => p.userId));

  for (const seed of NEARBY_SEEDS) {
    if (existingUserIds.has(seed.userId)) continue;
    const id = db.nextProviderId++;
    db.providers[id] = { id, ...seed };

    const services = NEARBY_SERVICES_BY_USER_ID[seed.userId] ?? [];
    for (const svc of services) {
      const sid = db.nextServiceId++;
      db.services[sid] = { id: sid, providerId: id, ...svc };
    }
  }

  saveProvidersDb(db);
  localStorage.setItem(NEARBY_SEED_KEY, "1");
}

// =============================================================================
// Reviews seed
// =============================================================================

function seedReviewsIfNeeded(): void {
  const db = readReviewsDb();
  if (db.seeded) return;
  const now = Date.now();
  const dayAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

  // We seed reviews against the *userIds* of the seeded providers, then
  // resolve the FK to providerId at read time. This makes the seed
  // resilient even if the providers DB hasn't been initialised yet
  // (the very first call to /reviews will then return an empty list).
  const reviewsByUserId: Record<string, Array<Omit<ProviderReview, "id" | "providerId" | "createdAt"> & { daysAgo: number }>> = {
    seed_provider_2: [
      { authorName: "أحمد م.", rating: 5, comment: "خدمة ممتازة وسعر معقول، أنصح فيهم.", daysAgo: 2 },
      { authorName: "فهد ع.", rating: 4, comment: "سريعين في التشخيص، شغل نظيف.", daysAgo: 5 },
      { authorName: "سارة ف.", rating: 5, comment: "تعاملوا معاي باحترام واهتمام وشغل ممتاز.", daysAgo: 12 },
    ],
    seed_nearby_1: [
      { authorName: "محمد ك.", rating: 5, comment: "صيانة 10,000 كم بسعر منافس وشغل احترافي.", daysAgo: 1 },
      { authorName: "خالد ر.", rating: 5, comment: "أمين ومحترم، يفصّل لك الأعطال بالتفصيل.", daysAgo: 7 },
      { authorName: "نوف س.", rating: 4, comment: "الانتظار طويل شوي بس النتيجة تستاهل.", daysAgo: 14 },
      { authorName: "بدر ع.", rating: 5, comment: "أفضل ورشة جربتها في الرياض.", daysAgo: 21 },
    ],
    seed_nearby_2: [
      { authorName: "عبدالعزيز م.", rating: 4, comment: "سريع وما يأخذ وقت، تعبئة زيت بسرعة.", daysAgo: 3 },
      { authorName: "ريم ا.", rating: 5, comment: "نظافة المكان وسرعة الخدمة فوق العادة.", daysAgo: 8 },
    ],
    seed_nearby_3: [
      { authorName: "تركي ج.", rating: 4, comment: "غسيل ممتاز بسعر مناسب.", daysAgo: 4 },
    ],
    seed_nearby_4: [
      { authorName: "سلمان د.", rating: 5, comment: "أصلحوا قطعة جانب السيارة وما تعرف فيها كأنها جديدة!", daysAgo: 6 },
      { authorName: "هيا ن.", rating: 5, comment: "دقّة عالية في مطابقة اللون، شغل احترافي.", daysAgo: 9 },
    ],
    seed_nearby_5: [
      { authorName: "عمر ف.", rating: 5, comment: "وصلتني السطحة خلال 20 دقيقة الفجر!", daysAgo: 2 },
      { authorName: "نواف خ.", rating: 4, comment: "خدمة موثوقة في أوقات الطوارئ.", daysAgo: 11 },
    ],
    seed_nearby_6: [
      { authorName: "ماجد ت.", rating: 5, comment: "تكييف السيارة كأنه جديد، شكراً.", daysAgo: 3 },
    ],
    seed_nearby_7: [
      { authorName: "يوسف ع.", rating: 4, comment: "ميزانية ممتازة وسعر معقول.", daysAgo: 5 },
    ],
  };

  const providers = readProvidersDb().providers;
  const userIdToProviderId = new Map<string, number>(
    Object.values(providers).map((p) => [p.userId, p.id]),
  );

  for (const [userId, list] of Object.entries(reviewsByUserId)) {
    const providerId = userIdToProviderId.get(userId);
    if (!providerId) continue;
    for (const item of list) {
      db.reviews.push({
        id: db.nextId++,
        providerId,
        authorName: item.authorName,
        rating: item.rating,
        comment: item.comment,
        createdAt: dayAgo(item.daysAgo),
      });
    }
  }
  db.seeded = true;
  saveReviewsDb(db);
}

// =============================================================================
// Handler
// =============================================================================

/**
 * Routes:
 *   GET    /services/nearby
 *   GET    /ServiceProviders/{id}/reviews
 *   GET    /favorites
 *   POST   /favorites/{providerId}
 *   DELETE /favorites/{providerId}
 */
export async function tryDiscoveryMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\//, "");
  const method = (config.method ?? "get").toLowerCase();

  // Make sure the nearby + reviews seeds exist before answering anything.
  seedNearbyIfNeeded();
  seedReviewsIfNeeded();

  // -- GET /services/nearby ---------------------------------------------------
  if (url === "services/nearby" && method === "get") {
    const params = (config.params ?? {}) as Partial<{
      lat: number | string;
      lng: number | string;
      radiusKm: number | string;
      categoryId: number | string;
      minRating: number | string;
      priceBand: PriceBand;
      openNowOnly: boolean | string;
      q: string;
    }>;

    const lat = Number(params.lat);
    const lng = Number(params.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw fail(config, 400, "VALIDATION", "lat/lng required");
    }

    const radiusKm = Number(params.radiusKm) || 10;
    const categoryId = params.categoryId != null ? Number(params.categoryId) : null;
    const minRating = Number(params.minRating) || 0;
    const priceBand = params.priceBand ?? null;
    const openNowOnly =
      params.openNowOnly === true || params.openNowOnly === "true";
    const q = (params.q ?? "").toString().trim().toLowerCase();

    const db = readProvidersDb();
    const approved = Object.values(db.providers).filter(
      (p) => p.status === "approved" && p.lat != null && p.lng != null,
    );

    const result: NearbyProvider[] = approved
      .map((p) => {
        // p.lat/p.lng confirmed non-null by filter above.
        const dist = distanceKm(
          { lat, lng },
          { lat: p.lat as number, lng: p.lng as number },
        );
        const services = Object.values(db.services).filter(
          (s) => s.providerId === p.id,
        );
        const prices = services.map((s) => s.price).filter((n) => Number.isFinite(n));
        const priceFrom = prices.length ? Math.min(...prices) : null;
        return {
          id: p.id,
          companyName: p.companyName,
          city: p.city,
          address: p.address,
          lat: p.lat as number,
          lng: p.lng as number,
          rating: p.rating,
          totalRatings: p.totalRatings,
          isVerified: p.isVerified,
          categoryIds: p.categoryIds,
          distanceKm: Number(dist.toFixed(2)),
          priceFrom,
          isOpenNow: isOpenNow(p.workingHours),
        } satisfies NearbyProvider;
      })
      // Radius
      .filter((p) => p.distanceKm <= radiusKm)
      // Category
      .filter((p) => (categoryId == null ? true : p.categoryIds.includes(categoryId)))
      // Rating
      .filter((p) => p.rating >= minRating)
      // Price band
      .filter((p) =>
        priceBand == null ? true : priceBandIncludes(p.priceFrom, priceBand),
      )
      // Open now
      .filter((p) => (openNowOnly ? p.isOpenNow : true))
      // Free-text query
      .filter((p) =>
        q.length === 0 ? true : p.companyName.toLowerCase().includes(q),
      )
      // Closest first
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return ok(config, result);
  }

  // -- GET /ServiceProviders/{id}/reviews ------------------------------------
  let m = url.match(/^ServiceProviders\/(\d+)\/reviews$/);
  if (m && method === "get") {
    const providerId = Number(m[1]);
    const limit = Number((config.params as { limit?: number } | undefined)?.limit ?? 10);
    const offset = Number((config.params as { offset?: number } | undefined)?.offset ?? 0);

    const db = readReviewsDb();
    const items = db.reviews
      .filter((r) => r.providerId === providerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = items.length;
    const avg = total
      ? Number((items.reduce((s, r) => s + r.rating, 0) / total).toFixed(2))
      : 0;
    const page = items.slice(offset, offset + limit);

    const payload: ProviderReviewsResponse = {
      total,
      averageRating: avg,
      items: page,
    };
    return ok(config, payload);
  }

  // -- GET /favorites ---------------------------------------------------------
  if (url === "favorites" && method === "get") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    const db = readFavoritesDb();
    const list = (db.byUser[me.id] ?? []).map<FavoriteEntry>((providerId) => ({
      providerId,
      createdAt: new Date().toISOString(),
    }));
    return ok(config, list);
  }

  // -- POST /favorites/{providerId} ------------------------------------------
  m = url.match(/^favorites\/(\d+)$/);
  if (m && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    const providerId = Number(m[1]);

    const providers = readProvidersDb().providers;
    if (!providers[providerId]) {
      throw fail(config, 404, "NOT_FOUND", "غير موجود");
    }

    const db = readFavoritesDb();
    const list = db.byUser[me.id] ?? [];
    if (!list.includes(providerId)) list.push(providerId);
    db.byUser[me.id] = list;
    saveFavoritesDb(db);

    return ok(
      config,
      { providerId, createdAt: new Date().toISOString() } satisfies FavoriteEntry,
      201,
    );
  }

  // -- DELETE /favorites/{providerId} ----------------------------------------
  if (m && method === "delete") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    const providerId = Number(m[1]);
    const db = readFavoritesDb();
    db.byUser[me.id] = (db.byUser[me.id] ?? []).filter((id) => id !== providerId);
    saveFavoritesDb(db);
    return ok(config, { success: true });
  }

  return null;
}
