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
} from "../../../modules/workshop/types";

// ── DB shape ──────────────────────────────────────────────────────────────────

interface WorkshopDb {
  profile: WorkshopProfile | null;
  subscription: WorkshopSubscription | null;
  seeded: boolean;
}

// ── Storage keys / constants ──────────────────────────────────────────────────

const WORKSHOP_DB_KEY = "maqwad.workshop.mockDb";
const MOCK_SEED_VERSION = 2;
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

// ── Seed ─────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: WorkshopDb): void {
  if (db.seeded) return;

  const now = new Date().toISOString();

  // ── Profile ──────────────────────────────────────────────────────────────
  db.profile = {
    workshopId: WORKSHOP_ID,
    companyName: "ورشة الخليج للسيارات - جدة",
    email: "toyota@workshop.sa",
    phone: "501110008",
    address: "طريق المدينة، جدة",
    city: "جدة",
    workingHours: "السبت — الخميس 9 ص — 9 م",
    specialization: "ميكانيكا/كهرباء/صيانة دورية",
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
      ...(payload.workingHours !== undefined ? { workingHours: payload.workingHours } : {}),
      ...(payload.specialization !== undefined ? { specialization: payload.specialization } : {}),
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
