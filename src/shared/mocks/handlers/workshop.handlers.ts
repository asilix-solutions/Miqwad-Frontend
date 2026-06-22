/**
 * In-process mock for Workshop Dashboard.
 * Mirrors the dealer.handlers.ts structure: seed-version self-heal,
 * safe URLSearchParams param parsing (strips undefined/null/""), and
 * profile + subscription endpoints only. Inquiries are handled by the
 * external chat system (not this module).
 */
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type {
  WorkshopProfile,
  WorkshopSubscription,
  WeeklyHours,
} from "../../../modules/workshop/types";

// ── DB shape ──────────────────────────────────────────────────────────────────

interface WorkshopDb {
  profile: WorkshopProfile | null;
  subscription: WorkshopSubscription | null;
  seeded: boolean;
}

// ── Storage keys / constants ──────────────────────────────────────────────────

const WORKSHOP_DB_KEY = "maqwad.workshop.mockDb";
const MOCK_SEED_VERSION = 5;
const MOCK_SEED_VERSION_KEY = "maqwad.workshop.mockSeedVersion";
const WORKSHOP_ID = 8; // matches seed_provider_8 numeric id

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadDb(): WorkshopDb {
  try {
    const storedVersionStr = localStorage.getItem(MOCK_SEED_VERSION_KEY);
    const storedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (storedVersion !== MOCK_SEED_VERSION) {
      localStorage.removeItem(WORKSHOP_DB_KEY);
      localStorage.setItem(MOCK_SEED_VERSION_KEY, MOCK_SEED_VERSION.toString());
      return { profile: null, subscription: null, seeded: false };
    }

    const raw = localStorage.getItem(WORKSHOP_DB_KEY);
    if (raw) return JSON.parse(raw) as WorkshopDb;
  } catch {
    /* ignore */
  }
  return { profile: null, subscription: null, seeded: false };
}

function saveDb(db: WorkshopDb): void {
  localStorage.setItem(WORKSHOP_DB_KEY, JSON.stringify(db));
}

// ── Response factories ────────────────────────────────────────────────────────

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  code: string,
  message: string,
) {
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

// ── Body parser ───────────────────────────────────────────────────────────────

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

// ── Offline image assets ──────────────────────────────────────────────────────

function svgDataUri(markup: string): string {
  return `data:image/svg+xml;base64,${btoa(markup)}`;
}

const BANNER_DATA_URI = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#032d60"/><stop offset="100%" stop-color="#0a4a96"/></linearGradient></defs><rect width="1200" height="300" fill="url(#bg)"/><circle cx="1100" cy="30" r="180" fill="#fff" fill-opacity=".04"/><circle cx="100" cy="290" r="120" fill="#fff" fill-opacity=".03"/><circle cx="600" cy="360" r="240" fill="#fff" fill-opacity=".02"/></svg>`,
);

const PHOTO_DATA_URIS = [1, 2, 3].map((n) =>
  svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#e2e8f0"/><rect x="220" y="140" width="160" height="110" rx="10" fill="#cbd5e1"/><polygon points="220,250 280,195 340,235 375,195 380,250" fill="#94a3b8"/><circle cx="355" cy="168" r="16" fill="#94a3b8"/><text x="300" y="325" text-anchor="middle" font-size="48" font-family="Arial,sans-serif" fill="#94a3b8" font-weight="bold">${n}</text></svg>`,
  ),
);

// ── Seed ─────────────────────────────────────────────────────────────────────

const SEED_WORKING_HOURS: WeeklyHours = {
  sat: { isClosed: false, open: "09:00", close: "21:00" },
  sun: { isClosed: false, open: "09:00", close: "21:00" },
  mon: { isClosed: false, open: "09:00", close: "21:00" },
  tue: { isClosed: false, open: "09:00", close: "21:00" },
  wed: { isClosed: false, open: "09:00", close: "21:00" },
  thu: { isClosed: false, open: "09:00", close: "21:00" },
  fri: { isClosed: true },
};

function seedIfEmpty(db: WorkshopDb): void {
  if (db.seeded) return;

  const now = new Date().toISOString();

  // ── Profile ──────────────────────────────────────────────────────────────
  db.profile = {
    workshopId: WORKSHOP_ID,
    companyName: "ورشة الخليج للسيارات - جدة",
    email: "toyota@workshop.sa",

    // Legacy flat fields
    phone: "501110008",
    address: "طريق الملك عبدالعزيز، حي النزهة، جدة",
    city: "جدة",
    workingHoursLabel: "السبت — الخميس 9 ص — 9 م",
    specializationLabel: "ميكانيكا / كهرباء / صيانة دورية",

    // Structured fields
    bannerUrl: BANNER_DATA_URI,
    photos: PHOTO_DATA_URIS,
    location: {
      lat: 21.5433,
      lng: 39.1728,
      address: "طريق الملك عبدالعزيز، حي النزهة",
      city: "جدة",
    },
    workingHours: SEED_WORKING_HOURS,
    specializations: {
      serviceTypes: ["mechanical", "electrical", "periodicMaintenance"],
      vehicleBrands: ["toyota", "hyundai"],
    },
    contact: {
      phone: "501110008",
      whatsapp: "966501110008",
    },

    // Meta
    rating: 4.8,
    totalRatings: 320,
    isVerified: true,
    updatedAt: now,
  };

  // ── Subscription ──────────────────────────────────────────────────────────
  const startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();

  db.subscription = {
    id: "sub_ws_001",
    workshopId: WORKSHOP_ID,
    planName: "الباقة المميزة",
    price: 299,
    billingCycle: "monthly",
    status: "active",
    startDate,
    endDate,
    privileges: {
      topListing: true,
      freeInspectionOffers: true,
    },
  };

  db.seeded = true;
  saveDb(db);
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function tryWorkshopMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  if (!url.startsWith("workshop/")) return null;

  const db = loadDb();
  seedIfEmpty(db);

  // Safe param extraction: strip undefined/null/"" before creating URLSearchParams
  let path = url;
  if (url.includes("?")) {
    const [p] = url.split("?");
    path = p;
  }

  // ── GET /workshop/profile ─────────────────────────────────────────────────
  if (path === "workshop/profile" && method === "get") {
    if (!db.profile) throw fail(config, 404, "NOT_FOUND", "Workshop profile not found");
    return ok(config, db.profile);
  }

  // ── PUT /workshop/profile ─────────────────────────────────────────────────
  if (path === "workshop/profile" && method === "put") {
    if (!db.profile) throw fail(config, 404, "NOT_FOUND", "Workshop profile not found");
    const payload = parseBody(config.data) as Partial<WorkshopProfile>;
    const now = new Date().toISOString();
    db.profile = {
      ...db.profile,
      ...(payload.companyName !== undefined ? { companyName: payload.companyName } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.city !== undefined ? { city: payload.city } : {}),
      ...(payload.workingHoursLabel !== undefined
        ? { workingHoursLabel: payload.workingHoursLabel }
        : {}),
      ...(payload.specializationLabel !== undefined
        ? { specializationLabel: payload.specializationLabel }
        : {}),
      ...(payload.bannerUrl !== undefined ? { bannerUrl: payload.bannerUrl } : {}),
      ...(payload.photos !== undefined ? { photos: payload.photos } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.workingHours !== undefined ? { workingHours: payload.workingHours } : {}),
      ...(payload.specializations !== undefined
        ? { specializations: payload.specializations }
        : {}),
      ...(payload.contact !== undefined ? { contact: payload.contact } : {}),
      updatedAt: now,
    };
    saveDb(db);
    return ok(config, db.profile);
  }

  // ── GET /workshop/subscription ────────────────────────────────────────────
  if (path === "workshop/subscription" && method === "get") {
    if (!db.subscription) throw fail(config, 404, "NOT_FOUND", "No active subscription");
    return ok(config, db.subscription);
  }

  // ── POST /workshop/subscription/renew ─────────────────────────────────────
  if (path === "workshop/subscription/renew" && method === "post") {
    if (!db.subscription) throw fail(config, 404, "NOT_FOUND", "No subscription to renew");
    const now = new Date().toISOString();
    const currentEnd = new Date(db.subscription.endDate);
    const newEnd = new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.subscription = {
      ...db.subscription,
      status: "active",
      endDate: newEnd,
      renewedAt: now,
    };
    saveDb(db);
    return ok(config, db.subscription);
  }

  return null;
}
