import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

/**
 * In-process mock for Sprint 3 — Services Catalog & Provider Registration.
 *
 * Endpoints mocked:
 *   GET    /Services/categories
 *   GET    /Services/categories/{id}/subcategories
 *   POST   /ServiceProviders/register
 *   GET    /ServiceProviders/{id}/profile
 *   GET    /providers/{providerId}/services
 *   POST   /providers/{providerId}/services
 *   PUT    /providers/{providerId}/services/{serviceId}
 *   DELETE /providers/{providerId}/services/{serviceId}
 *   POST   /ServiceProviders/{id}/documents
 *
 * Admin endpoints (not yet in the Swagger but required by the MVP plan;
 * shapes follow the same conventions so the BE can adopt them later):
 *   GET    /admin/providers?status=pending|approved|rejected
 *   PATCH  /admin/providers/{id}/approve
 *   PATCH  /admin/providers/{id}/reject  body: { reason: string }
 *
 * State persists in localStorage so the demo survives reloads.
 * The mock also mutates the `maqwad.user` blob (the FE source of truth
 * for the current user) when a customer becomes a provider, so the
 * sidebar instantly switches to the provider variant.
 */

import type {
  KycDocumentType,
  ProviderDocument,
  ProviderProfile,
  ProviderService,
} from "@modules/providers/types";
import type {
  ServiceCategory,
  ServiceSubcategory,
} from "@modules/services/types";
import { KSA_CITIES } from "@modules/discovery/types";
import type { City } from "@modules/admin/types";


interface CurrentUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;
  providerStatus?: "pending" | "approved" | "rejected" | null;
  providerRejectionReason?: string | null;
}

interface ProvidersDb {
  providers: Record<number, ProviderProfile>;
  services: Record<number, ProviderService>;
  nextProviderId: number;
  nextServiceId: number;
  seeded: boolean;
}

const PROVIDERS_DB_KEY = "maqwad.mockProvidersDb";

const MOCK_SEED_VERSION = 4;
const MOCK_SEED_VERSION_KEY = "maqwad.mockSeedVersion";

function loadDb(): ProvidersDb {
  try {
    const storedVersionStr = localStorage.getItem(MOCK_SEED_VERSION_KEY);
    const storedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (storedVersion !== MOCK_SEED_VERSION) {
      // Version mismatch: seed shape changed. Clear all mock caches.
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("maqwad.")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(MOCK_SEED_VERSION_KEY, MOCK_SEED_VERSION.toString());

      // Return empty DB so seedIfEmpty will re-run
      return { providers: {}, services: {}, nextProviderId: 1, nextServiceId: 1, seeded: false };
    }

    const raw = localStorage.getItem(PROVIDERS_DB_KEY);
    if (raw) return JSON.parse(raw) as ProvidersDb;
  } catch {
    /* ignore */
  }
  return { providers: {}, services: {}, nextProviderId: 1, nextServiceId: 1, seeded: false };
}

function saveDb(db: ProvidersDb): void {
  localStorage.setItem(PROVIDERS_DB_KEY, JSON.stringify(db));
}

function readCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("maqwad.user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

function writeCurrentUser(user: CurrentUser): void {
  localStorage.setItem("maqwad.user", JSON.stringify(user));
}

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

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof data === "object") return data as Record<string, unknown>;
  return {};
}

// =============================================================================
// Lookup data
// =============================================================================

/**
 * Hard-coded service categories. These ids/names match what the backend
 * will eventually seed — replace by the real `GET /Services/categories`
 * response shape once the API is live.
 */
let nextCategoryId = 11;
let CATEGORIES: ServiceCategory[] = [
  { id: 1, nameAr: "تغيير الزيت", nameEn: "Oil change", iconUrl: null, colorHint: "orange" },
  { id: 2, nameAr: "الكهرباء", nameEn: "Electrical", iconUrl: null, colorHint: "blue" },
  { id: 3, nameAr: "الكفرات", nameEn: "Tires", iconUrl: null, colorHint: "navy" },
  { id: 4, nameAr: "الصيانة الدورية", nameEn: "Periodic maintenance", iconUrl: null, colorHint: "green" },
  { id: 5, nameAr: "تكييف وتبريد", nameEn: "AC & cooling", iconUrl: null, colorHint: "blue" },
  { id: 6, nameAr: "البطاريات", nameEn: "Batteries", iconUrl: null, colorHint: "red" },
  { id: 7, nameAr: "الميكانيكا العامة", nameEn: "General mechanics", iconUrl: null, colorHint: "purple" },
  { id: 8, nameAr: "غسيل وتلميع", nameEn: "Wash & detailing", iconUrl: null, colorHint: "green" },
  { id: 9, nameAr: "السمكرة والدهان", nameEn: "Body & paint", iconUrl: null, colorHint: "red" },
  { id: 10, nameAr: "النقل والاستلام", nameEn: "Pickup & delivery", iconUrl: null, colorHint: "navy" },
];

let CITIES: City[] = [...KSA_CITIES].map((c) => ({
  id: c.key,
  nameAr: c.nameAr,
  nameEn: c.nameEn,
}));


const SUBCATEGORIES: Record<number, ServiceSubcategory[]> = {
  1: [
    { id: 101, categoryId: 1, nameAr: "تغيير زيت محرك", nameEn: "Engine oil change", averagePrice: 180 },
    { id: 102, categoryId: 1, nameAr: "تغيير فلتر زيت", nameEn: "Oil filter replacement", averagePrice: 60 },
  ],
  2: [
    { id: 201, categoryId: 2, nameAr: "فحص كهربائي شامل", nameEn: "Full electrical check", averagePrice: 250 },
    { id: 202, categoryId: 2, nameAr: "تركيب دينمو", nameEn: "Alternator installation", averagePrice: 450 },
  ],
  3: [
    { id: 301, categoryId: 3, nameAr: "تغيير إطار", nameEn: "Tire replacement", averagePrice: 350 },
    { id: 302, categoryId: 3, nameAr: "ميزانية وعدلية", nameEn: "Wheel alignment & balancing", averagePrice: 150 },
  ],
  4: [
    { id: 401, categoryId: 4, nameAr: "صيانة 10,000 كم", nameEn: "10k km service", averagePrice: 400 },
    { id: 402, categoryId: 4, nameAr: "صيانة 50,000 كم", nameEn: "50k km service", averagePrice: 950 },
  ],
  5: [
    { id: 501, categoryId: 5, nameAr: "تعبئة فريون", nameEn: "Refrigerant top-up", averagePrice: 200 },
    { id: 502, categoryId: 5, nameAr: "تنظيف كمبروسر", nameEn: "Compressor cleaning", averagePrice: 320 },
  ],
  6: [
    { id: 601, categoryId: 6, nameAr: "بطارية 60 أمبير", nameEn: "60Ah battery", averagePrice: 320 },
    { id: 602, categoryId: 6, nameAr: "بطارية 100 أمبير", nameEn: "100Ah battery", averagePrice: 550 },
  ],
  7: [
    { id: 701, categoryId: 7, nameAr: "كشف عطل عام", nameEn: "General diagnostics", averagePrice: 180 },
    { id: 702, categoryId: 7, nameAr: "إصلاح ناقل الحركة", nameEn: "Gearbox repair", averagePrice: 1500 },
  ],
  8: [
    { id: 801, categoryId: 8, nameAr: "غسيل خارجي", nameEn: "Exterior wash", averagePrice: 40 },
    { id: 802, categoryId: 8, nameAr: "تلميع شامل", nameEn: "Full detailing", averagePrice: 350 },
  ],
  9: [
    { id: 901, categoryId: 9, nameAr: "سمكرة قطعة", nameEn: "Body panel repair", averagePrice: 600 },
    { id: 902, categoryId: 9, nameAr: "دهان قطعة", nameEn: "Single panel paint", averagePrice: 450 },
  ],
  10: [
    { id: 1001, categoryId: 10, nameAr: "سحب سيارة معطّلة", nameEn: "Tow truck", averagePrice: 250 },
    { id: 1002, categoryId: 10, nameAr: "استلام للصيانة", nameEn: "Pickup for service", averagePrice: 150 },
  ],
};

// =============================================================================
// Seed
// =============================================================================

/**
 * Seed a few demo providers so the Admin Review screen has data
 * when an admin signs in for the first time.
 */
function seedIfEmpty(db: ProvidersDb): void {
  if (db.seeded) return;
  const now = new Date().toISOString();

  const seeds: Array<Omit<ProviderProfile, "id">> = [
    {
      userId: "seed_provider_1",
      companyName: "ورشة الخليج للسيارات",
      type: "workshop",
      email: "info@gulf-workshop.sa",
      phone: "501110001",
      lat: 24.7136,
      lng: 46.6753,
      address: "حي العليا، شارع الملك فهد، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 9 ص — 9 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: [1, 4, 7],
      specialization: "ميكانيكا/كهرباء",
      photos: ["https://picsum.photos/seed/ws1a/400/300", "https://picsum.photos/seed/ws1b/400/300"],
      documents: [
        {
          type: "commercial",
          fileName: "commercial-register-1.pdf",
          fileSize: 245_000,
          url: "mock://docs/commercial-1.pdf",
          uploadedAt: now,
        },
        {
          type: "identity",
          fileName: "owner-id-1.jpg",
          fileSize: 980_000,
          url: "mock://docs/identity-1.jpg",
          uploadedAt: now,
        },
      ],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_2",
      companyName: "مركز الإتقان للكهرباء",
      type: "workshop",
      email: "support@etqan-elec.sa",
      phone: "501110002",
      lat: 21.3891,
      lng: 39.8579,
      address: "حي الصفا، جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 10 ص — 11 م",
      rating: 4.6,
      totalRatings: 132,
      isVerified: true,
      status: "approved",
      categoryIds: [2, 6],
      specialization: "تكييف وتبريد/كهرباء",
      photos: ["https://picsum.photos/seed/ws2a/400/300", "https://picsum.photos/seed/ws2b/400/300"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_3",
      companyName: "مغسلة النخبة",
      type: "workshop",
      email: "hello@nokhba-wash.sa",
      phone: "501110003",
      lat: 26.4207,
      lng: 50.0888,
      address: "حي الفيصلية، الدمام",
      city: "الدمام",
      workingHours: "كل يوم 8 ص — 12 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [8],
      specialization: "غسيل وتلميع",
      photos: ["https://picsum.photos/seed/ws3a/400/300", "https://picsum.photos/seed/ws3b/400/300"],
      documents: [],
      rejectionReason: "السجل التجاري غير واضح. الرجاء رفع نسخة بجودة أفضل.",
      createdAt: now,
    },
    {
      userId: "seed_provider_4",
      companyName: "تشليح الرياض لقطع الغيار",
      type: "scrap",
      email: "riyadh@scrap.sa",
      phone: "501110004",
      lat: 24.5829,
      lng: 46.7725,
      address: "صناعية الشفا، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 8 ص — 6 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: [3, 7],
      brandSpecialization: ["تويوتا", "نيسان"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_5",
      companyName: "تشليح السعادة للسيارات",
      type: "scrap",
      email: "saada@scrap.sa",
      phone: "501110005",
      lat: 21.4881,
      lng: 39.1832,
      address: "صناعية جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 8 ص — 6 م",
      rating: 4.2,
      totalRatings: 85,
      isVerified: true,
      status: "approved",
      categoryIds: [7, 9],
      brandSpecialization: ["جي إم سي", "فورد", "شيفروليه"],
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_6",
      companyName: "تشليح المدينة للسيارات",
      type: "scrap",
      email: "madinah@scrap.sa",
      phone: "501110006",
      lat: 24.4686,
      lng: 39.6111,
      address: "المنطقة الصناعية، المدينة المنورة",
      city: "المدينة المنورة",
      workingHours: "السبت — الخميس 8 ص — 5 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [7],
      brandSpecialization: ["هونداي", "كيا"],
      documents: [],
      rejectionReason: "صورة الهوية غير مطابقة",
      createdAt: now,
    },
    {
      userId: "seed_provider_7",
      companyName: "متجر الشامل لقطع الغيار",
      type: "dealer",
      email: "shamel@dealer.sa",
      phone: "501110007",
      lat: 24.7115,
      lng: 46.6742,
      address: "شارع التحلية، الرياض",
      city: "الرياض",
      workingHours: "السبت — الخميس 9 ص — 10 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: [1, 2, 6],
      commissionRate: 5,
      monthlySales: 15000,
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_8",
      companyName: "موزع قطع تويوتا المعتمد",
      type: "dealer",
      email: "toyota@dealer.sa",
      phone: "501110008",
      lat: 21.5433,
      lng: 39.1728,
      address: "طريق المدينة، جدة",
      city: "جدة",
      workingHours: "السبت — الخميس 9 ص — 9 م",
      rating: 4.8,
      totalRatings: 320,
      isVerified: true,
      status: "approved",
      categoryIds: [4, 7],
      commissionRate: 10,
      monthlySales: 45000,
      documents: [],
      rejectionReason: null,
      createdAt: now,
    },
    {
      userId: "seed_provider_9",
      companyName: "شركة الأجزاء الحديثة",
      type: "dealer",
      email: "modern@dealer.sa",
      phone: "501110009",
      lat: 26.3927,
      lng: 49.9777,
      address: "الشارع التجاري، الدمام",
      city: "الدمام",
      workingHours: "السبت — الخميس 9 ص — 8 م",
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "rejected",
      categoryIds: [5, 2],
      commissionRate: 7,
      monthlySales: 22000,
      documents: [],
      rejectionReason: "نقص في مستندات الوكالة التجارية",
      createdAt: now,
    },
  ];

  for (const seed of seeds) {
    const id = db.nextProviderId++;
    db.providers[id] = { id, ...seed };
  }

  // Demo services for the approved provider (so /provider/services has data when reviewed by admin).
  const approvedProviderId = Object.values(db.providers).find((p) => p.status === "approved")?.id;
  if (approvedProviderId) {
    const demoSvcs: Array<Omit<ProviderService, "id" | "providerId">> = [
      {
        name: "فحص كهربائي شامل",
        description: "كشف الأعطال الكهربائية بأحدث الأجهزة",
        price: 220,
        estimatedDuration: 45,
        categoryId: 2,
        subcategoryId: 201,
        categoryName: "الكهرباء",
        subcategoryName: "فحص كهربائي شامل",
      },
      {
        name: "تركيب بطارية 60 أمبير",
        description: "تركيب وفحص دائرة الشحن",
        price: 380,
        estimatedDuration: 20,
        categoryId: 6,
        subcategoryId: 601,
        categoryName: "البطاريات",
        subcategoryName: "بطارية 60 أمبير",
      },
    ];
    for (const svc of demoSvcs) {
      const id = db.nextServiceId++;
      db.services[id] = { id, providerId: approvedProviderId, ...svc };
    }
  }

  db.seeded = true;
  saveDb(db);
}

// =============================================================================
// Helpers
// =============================================================================

function categoryNameById(id: number | null): string | null {
  if (id == null) return null;
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.nameAr : null;
}

function subcategoryNameById(id: number | null): string | null {
  if (id == null) return null;
  for (const subs of Object.values(SUBCATEGORIES)) {
    const s = subs.find((x) => x.id === id);
    if (s) return s.nameAr;
  }
  return null;
}

function normaliseDocs(raw: unknown): ProviderDocument[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();
  const allowed: KycDocumentType[] = ["commercial", "tax", "identity"];
  return raw
    .map((entry) => {
      const e = entry as Partial<ProviderDocument>;
      if (!e || !e.type || !allowed.includes(e.type as KycDocumentType)) return null;
      return {
        type: e.type as KycDocumentType,
        fileName: String(e.fileName ?? "document"),
        fileSize: Number.isFinite(e.fileSize) ? Number(e.fileSize) : 0,
        url: e.url ?? `mock://docs/${e.fileName ?? "document"}`,
        uploadedAt: e.uploadedAt ?? now,
      } satisfies ProviderDocument;
    })
    .filter((x): x is ProviderDocument => x !== null);
}

// =============================================================================
// Handler
// =============================================================================

export async function tryProvidersMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();
  const db = loadDb();
  seedIfEmpty(db);

  // -- GET /Services/categories -----------------------------------------------
  if (url === "Services/categories" && method === "get") {
    return ok(config, CATEGORIES);
  }

  // -- GET /Services/categories/{id}/subcategories ----------------------------
  let m = url.match(/^Services\/categories\/(\d+)\/subcategories$/);
  if (m && method === "get") {
    const categoryId = Number(m[1]);
    return ok(config, SUBCATEGORIES[categoryId] ?? []);
  }

  // -- POST /ServiceProviders/register ----------------------------------------
  if (url === "ServiceProviders/register" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");

    const body = parseBody(config.data) as {
      companyName?: string;
      email?: string;
      phone?: string;
      password?: string;
      lat?: number | null;
      lng?: number | null;
      address?: string;
      city?: string;
      workingHours?: string;
      categoryIds?: number[];
      documents?: Array<Partial<ProviderDocument>>;
    };

    if (!body.companyName || !body.email || !body.phone) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    const id = db.nextProviderId++;
    const profile: ProviderProfile = {
      id,
      userId: me.id,
      type: "workshop",
      companyName: String(body.companyName),
      email: String(body.email),
      phone: String(body.phone),
      lat: typeof body.lat === "number" ? body.lat : null,
      lng: typeof body.lng === "number" ? body.lng : null,
      address: body.address ? String(body.address) : null,
      city: body.city ? String(body.city) : null,
      workingHours: body.workingHours ? String(body.workingHours) : null,
      rating: 0,
      totalRatings: 0,
      isVerified: false,
      status: "pending",
      categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(Number) : [],
      documents: normaliseDocs(body.documents),
      rejectionReason: null,
      createdAt: new Date().toISOString(),
    };
    db.providers[id] = profile;
    saveDb(db);

    // Flip the current user to provider/pending so the router immediately
    // sends them to the pending screen.
    const updatedUser: CurrentUser = {
      ...me,
      role: "provider",
      providerId: id,
      providerStatus: "pending",
      providerRejectionReason: null,
    };
    writeCurrentUser(updatedUser);

    return ok(config, profile, 201);
  }

  // -- GET /ServiceProviders/{id}/profile -------------------------------------
  m = url.match(/^ServiceProviders\/(\d+)\/profile$/);
  if (m && method === "get") {
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    return ok(config, p);
  }

  // -- POST /ServiceProviders/{id}/documents ----------------------------------
  m = url.match(/^ServiceProviders\/(\d+)\/documents$/);
  if (m && method === "post") {
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as { documents?: Array<Partial<ProviderDocument>> };
    p.documents = normaliseDocs(body.documents);
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // -- GET /providers/{providerId}/services -----------------------------------
  m = url.match(/^providers\/(\d+)\/services$/);
  if (m && method === "get") {
    const providerId = Number(m[1]);
    const list = Object.values(db.services).filter((s) => s.providerId === providerId);
    return ok(config, list);
  }

  // -- POST /providers/{providerId}/services ----------------------------------
  if (m && method === "post") {
    const providerId = Number(m[1]);
    if (!db.providers[providerId]) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as Partial<ProviderService>;
    if (!body.name || body.price == null) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }
    const id = db.nextServiceId++;
    const svc: ProviderService = {
      id,
      providerId,
      name: String(body.name),
      description: body.description ?? null,
      price: Number(body.price),
      estimatedDuration:
        body.estimatedDuration != null ? Number(body.estimatedDuration) : null,
      categoryId: body.categoryId != null ? Number(body.categoryId) : null,
      subcategoryId: body.subcategoryId != null ? Number(body.subcategoryId) : null,
      categoryName: categoryNameById(body.categoryId != null ? Number(body.categoryId) : null),
      subcategoryName: subcategoryNameById(
        body.subcategoryId != null ? Number(body.subcategoryId) : null,
      ),
    };
    db.services[id] = svc;
    saveDb(db);
    return ok(config, svc, 201);
  }

  // -- PUT /providers/{providerId}/services/{serviceId} -----------------------
  m = url.match(/^providers\/(\d+)\/services\/(\d+)$/);
  if (m && method === "put") {
    const providerId = Number(m[1]);
    const serviceId = Number(m[2]);
    const svc = db.services[serviceId];
    if (!svc || svc.providerId !== providerId) {
      throw fail(config, 404, "NOT_FOUND", "غير موجود");
    }
    const body = parseBody(config.data) as Partial<ProviderService>;
    const updated: ProviderService = {
      ...svc,
      name: body.name ? String(body.name) : svc.name,
      description: body.description ?? svc.description,
      price: body.price != null ? Number(body.price) : svc.price,
      estimatedDuration:
        body.estimatedDuration != null ? Number(body.estimatedDuration) : svc.estimatedDuration,
      categoryId: body.categoryId != null ? Number(body.categoryId) : svc.categoryId,
      subcategoryId:
        body.subcategoryId != null ? Number(body.subcategoryId) : svc.subcategoryId,
    };
    updated.categoryName = categoryNameById(updated.categoryId);
    updated.subcategoryName = subcategoryNameById(updated.subcategoryId);
    db.services[serviceId] = updated;
    saveDb(db);
    return ok(config, updated);
  }

  // -- DELETE /providers/{providerId}/services/{serviceId} --------------------
  if (m && method === "delete") {
    const providerId = Number(m[1]);
    const serviceId = Number(m[2]);
    const svc = db.services[serviceId];
    if (!svc || svc.providerId !== providerId) {
      throw fail(config, 404, "NOT_FOUND", "غير موجود");
    }
    delete db.services[serviceId];
    saveDb(db);
    return ok(config, { success: true });
  }

  // -- POST /admin/categories -------------------------------------------------
  if (url === "admin/categories" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const body = parseBody(config.data) as Partial<ServiceCategory>;
    if (!body.nameAr || !body.nameEn) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    const id = nextCategoryId++;
    const newCat: ServiceCategory = {
      id,
      nameAr: String(body.nameAr),
      nameEn: String(body.nameEn),
      iconUrl: body.iconUrl ? String(body.iconUrl) : null,
      colorHint: body.colorHint as ServiceCategory["colorHint"],
    };
    CATEGORIES.push(newCat);
    return ok(config, newCat, 201);
  }

  // -- PUT /admin/categories/{id} ---------------------------------------------
  m = url.match(/^admin\/categories\/(\d+)$/);
  if (m && method === "put") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = Number(m[1]);
    const index = CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    const body = parseBody(config.data) as Partial<ServiceCategory>;
    const updated: ServiceCategory = {
      ...CATEGORIES[index],
      nameAr: body.nameAr ? String(body.nameAr) : CATEGORIES[index].nameAr,
      nameEn: body.nameEn ? String(body.nameEn) : CATEGORIES[index].nameEn,
      iconUrl: body.iconUrl !== undefined ? (body.iconUrl ? String(body.iconUrl) : null) : CATEGORIES[index].iconUrl,
      colorHint: body.colorHint !== undefined ? body.colorHint as ServiceCategory["colorHint"] : CATEGORIES[index].colorHint,
    };
    CATEGORIES[index] = updated;
    return ok(config, updated);
  }

  // -- DELETE /admin/categories/{id} ------------------------------------------
  if (m && method === "delete") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = Number(m[1]);
    const index = CATEGORIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    CATEGORIES.splice(index, 1);
    return ok(config, { success: true });
  }

  // -- GET /admin/cities ------------------------------------------------------
  if (url === "admin/cities" && method === "get") {
    return ok(config, CITIES);
  }

  // -- POST /admin/cities -----------------------------------------------------
  if (url === "admin/cities" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const body = parseBody(config.data) as Partial<City>;
    if (!body.nameAr || !body.nameEn) {
      throw fail(config, 400, "VALIDATION", "بيانات ناقصة");
    }

    const newCity: City = {
      id: `city_${Date.now()}`,
      nameAr: String(body.nameAr),
      nameEn: String(body.nameEn),
    };
    CITIES.push(newCity);
    return ok(config, newCity, 201);
  }

  // -- PUT /admin/cities/{id} -------------------------------------------------
  m = url.match(/^admin\/cities\/([^/]+)$/);
  if (m && method === "put") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = m[1];
    const index = CITIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    const body = parseBody(config.data) as Partial<City>;
    const updated: City = {
      ...CITIES[index],
      nameAr: body.nameAr ? String(body.nameAr) : CITIES[index].nameAr,
      nameEn: body.nameEn ? String(body.nameEn) : CITIES[index].nameEn,
    };
    CITIES[index] = updated;
    return ok(config, updated);
  }

  // -- DELETE /admin/cities/{id} ----------------------------------------------
  if (m && method === "delete") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");

    const id = m[1];
    const index = CITIES.findIndex((c) => c.id === id);
    if (index === -1) throw fail(config, 404, "NOT_FOUND", "غير موجود");

    CITIES.splice(index, 1);
    return ok(config, { success: true });
  }


  // -- GET /admin/providers?status=pending|approved|rejected ------------------
  if (url === "admin/providers" && method === "get") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    if (me.role !== "admin" && me.role !== "super_admin") throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const status = (config.params as { status?: string } | undefined)?.status;
    const type = (config.params as { type?: string } | undefined)?.type;
    const all = Object.values(db.providers);
    let filtered =
      !status || status === "all" ? all : all.filter((p) => p.status === status);
    
    if (type) {
      filtered = filtered.filter((p) => p.type === type);
    }
    // Newest first
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return ok(config, filtered);
  }

  // -- PATCH /admin/providers/{id}/approve ------------------------------------
  m = url.match(/^admin\/providers\/(\d+)\/approve$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me || (me.role !== "admin" && me.role !== "super_admin")) throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    p.status = "approved";
    p.isVerified = true;
    p.rejectionReason = null;
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // -- PATCH /admin/providers/{id}/reject -------------------------------------
  m = url.match(/^admin\/providers\/(\d+)\/reject$/);
  if (m && method === "patch") {
    const me = readCurrentUser();
    if (!me || (me.role !== "admin" && me.role !== "super_admin")) throw fail(config, 403, "FORBIDDEN", "غير مسموح");
    const id = Number(m[1]);
    const p = db.providers[id];
    if (!p) throw fail(config, 404, "NOT_FOUND", "غير موجود");
    const body = parseBody(config.data) as { reason?: string };
    p.status = "rejected";
    p.isVerified = false;
    p.rejectionReason = body.reason ? String(body.reason) : "بدون سبب محدد";
    db.providers[id] = p;
    saveDb(db);
    return ok(config, p);
  }

  // Not ours.
  return null;
}
