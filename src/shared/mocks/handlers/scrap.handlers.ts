/**
 * @file scrap.handlers.ts
 *
 * In-process mock for the scrap provider area.
 * Mirrors workshop.handlers.ts structure: seed-version self-heal,
 * safe URLSearchParams param parsing, PaginatedResponse for part-requests.
 * All images are offline SVG data-URIs (no external URLs).
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type {
  ScrapProfile,
  ScrapSubscription,
  PartRequest,
  PartRequestStatus,
  Escrow,
  EscrowStatus,
  ScrapStats,
  SubmitOfferPayload,
  ScrapVehicleBrand,
} from "../../../modules/scrap/types";
import type { PaginatedResponse } from "../../types/api";
import { canPartRequestTransition } from "../../../modules/scrap/lib/partRequestLifecycle";

// ── DB shape ──────────────────────────────────────────────────────────────────

interface ScrapDb {
  profile: ScrapProfile | null;
  subscription: ScrapSubscription | null;
  partRequests: Record<string, PartRequest>;
  escrows: Record<string, Escrow>;
  seeded: boolean;
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const SCRAP_DB_KEY = "maqwad.scrap.mockDb";
const MOCK_SEED_VERSION = 3;
const MOCK_SEED_VERSION_KEY = "maqwad.scrap.mockSeedVersion";
const SCRAP_ID = 11; // explicit id for seed_provider_10 (تشليح السلام)

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadDb(): ScrapDb {
  try {
    const storedVersionStr = localStorage.getItem(MOCK_SEED_VERSION_KEY);
    const storedVersion = storedVersionStr ? parseInt(storedVersionStr, 10) : 0;

    if (storedVersion !== MOCK_SEED_VERSION) {
      localStorage.removeItem(SCRAP_DB_KEY);
      localStorage.setItem(MOCK_SEED_VERSION_KEY, MOCK_SEED_VERSION.toString());
      return { profile: null, subscription: null, partRequests: {}, escrows: {}, seeded: false };
    }

    const raw = localStorage.getItem(SCRAP_DB_KEY);
    if (raw) return JSON.parse(raw) as ScrapDb;
  } catch {
    /* ignore */
  }
  return { profile: null, subscription: null, partRequests: {}, escrows: {}, seeded: false };
}

function saveDb(db: ScrapDb): void {
  localStorage.setItem(SCRAP_DB_KEY, JSON.stringify(db));
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
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

const BANNER_DATA_URI = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient></defs><rect width="1200" height="300" fill="url(#bg)"/><circle cx="1050" cy="50" r="200" fill="#fff" fill-opacity=".03"/><circle cx="150" cy="280" r="130" fill="#fff" fill-opacity=".03"/><circle cx="600" cy="380" r="260" fill="#F45E2B" fill-opacity=".04"/></svg>`,
);

const PHOTO_DATA_URIS = [1, 2, 3].map((n) =>
  svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#e2e8f0"/><rect x="180" y="120" width="240" height="160" rx="8" fill="#cbd5e1"/><rect x="200" y="140" width="80" height="60" rx="4" fill="#94a3b8"/><rect x="300" y="140" width="100" height="100" rx="4" fill="#94a3b8"/><text x="300" y="340" text-anchor="middle" font-size="48" font-family="Arial,sans-serif" fill="#94a3b8" font-weight="bold">${n}</text></svg>`,
  ),
);

const PART_PHOTO_URI = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#f1f5f9"/><circle cx="200" cy="130" r="70" fill="#cbd5e1" stroke="#94a3b8" stroke-width="4"/><circle cx="200" cy="130" r="30" fill="#94a3b8"/><text x="200" y="240" text-anchor="middle" font-size="24" font-family="Arial,sans-serif" fill="#94a3b8">قطعة غيار</text></svg>`,
);

// ── Seed ─────────────────────────────────────────────────────────────────────

interface SeedRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhoneMasked: string;
  vehicle: { brand: ScrapVehicleBrand; model: string; year: number };
  partName: string;
  description?: string;
  status: PartRequestStatus;
  daysAgo: number;
  escrowStatus?: EscrowStatus;
  escrowAmount?: number;
}

const SEED_REQUESTS: SeedRequest[] = [
  {
    id: "pr_001",
    requestNumber: "PRQ-2024-001",
    customerName: "محمد العمري",
    customerPhoneMasked: "05XXXXX201",
    vehicle: { brand: "toyota", model: "كامري", year: 2019 },
    partName: "مرفاع أمامي أيمن",
    description: "مرفاع الجانب الأيمن الأمامي، المقاس الأصلي فقط",
    status: "new",
    daysAgo: 0,
  },
  {
    id: "pr_002",
    requestNumber: "PRQ-2024-002",
    customerName: "خالد البقمي",
    customerPhoneMasked: "05XXXXX302",
    vehicle: { brand: "nissan", model: "باترول", year: 2017 },
    partName: "مضخة ماء",
    description: "مضخة ماء أصلية للمحرك VK56",
    status: "quoted",
    daysAgo: 1,
  },
  {
    id: "pr_003",
    requestNumber: "PRQ-2024-003",
    customerName: "عبدالرحمن السبيعي",
    customerPhoneMasked: "05XXXXX403",
    vehicle: { brand: "toyota", model: "لاندكروزر", year: 2020 },
    partName: "باب خلفي أيسر",
    description: "الباب الخلفي الأيسر مع الزجاج",
    status: "accepted",
    daysAgo: 2,
    escrowStatus: "held",
    escrowAmount: 2800,
  },
  {
    id: "pr_004",
    requestNumber: "PRQ-2024-004",
    customerName: "فيصل الدوسري",
    customerPhoneMasked: "05XXXXX504",
    vehicle: { brand: "bmw", model: "X5", year: 2018 },
    partName: "كمبروسر تكييف",
    status: "shipped",
    daysAgo: 3,
    escrowStatus: "held",
    escrowAmount: 3500,
  },
  {
    id: "pr_005",
    requestNumber: "PRQ-2024-005",
    customerName: "سلطان القحطاني",
    customerPhoneMasked: "05XXXXX605",
    vehicle: { brand: "mercedes", model: "E200", year: 2016 },
    partName: "علبة مراية جانبية",
    description: "مراية جانبية يمين مع موتور الطي",
    status: "completed",
    daysAgo: 5,
    escrowStatus: "released",
    escrowAmount: 950,
  },
  {
    id: "pr_006",
    requestNumber: "PRQ-2024-006",
    customerName: "ناصر الشمري",
    customerPhoneMasked: "05XXXXX706",
    vehicle: { brand: "ford", model: "F-150", year: 2021 },
    partName: "هيكل أمامي",
    description: "الهيكل الأمامي كامل",
    status: "cancelled",
    daysAgo: 7,
  },
];

function seedIfEmpty(db: ScrapDb): void {
  if (db.seeded) return;

  const now = new Date().toISOString();
  const dayMs = 24 * 60 * 60 * 1000;

  // ── Profile ──────────────────────────────────────────────────────────────
  db.profile = {
    scrapId: SCRAP_ID,
    companyName: "تشليح السلام",
    email: "salam@scrap.sa",
    bannerUrl: BANNER_DATA_URI,
    photos: PHOTO_DATA_URIS,
    specializations: {
      vehicleBrands: ["toyota", "nissan", "bmw", "mercedes"],
    },
    location: {
      lat: 24.7136,
      lng: 46.6753,
      address: "المنطقة الصناعية الثانية، شارع الصناعة",
      city: "الرياض",
    },
    contact: {
      phone: "501110010",
      whatsapp: "966501110010",
    },
    rating: 4.5,
    totalRatings: 178,
    isVerified: true,
    workingHoursLabel: "السبت — الخميس 8 ص — 6 م",
    updatedAt: now,
  };

  // ── Subscription ──────────────────────────────────────────────────────────
  const startDate = new Date(Date.now() - 8 * dayMs).toISOString();
  const endDate = new Date(Date.now() + 22 * dayMs).toISOString();

  db.subscription = {
    id: "sub_sc_001",
    scrapId: SCRAP_ID,
    planName: "باقة التشليح المميزة",
    price: 249,
    billingCycle: "monthly",
    status: "active",
    startDate,
    endDate,
    privileges: {
      priorityListing: true,
      verifiedBadge: true,
    },
  };

  // ── Part Requests + Escrows ───────────────────────────────────────────────
  for (const seed of SEED_REQUESTS) {
    const createdAt = new Date(Date.now() - seed.daysAgo * dayMs).toISOString();

    const escrowId = seed.escrowStatus ? `esc_${seed.id}` : undefined;

    const pr: PartRequest = {
      id: seed.id,
      requestNumber: seed.requestNumber,
      customerName: seed.customerName,
      customerPhoneMasked: seed.customerPhoneMasked,
      vehicle: seed.vehicle,
      partName: seed.partName,
      description: seed.description,
      photos: [PART_PHOTO_URI],
      status: seed.status,
      createdAt,
      escrowId,
    };
    db.partRequests[seed.id] = pr;

    if (seed.escrowStatus && escrowId) {
      const escrow: Escrow = {
        id: escrowId,
        partRequestId: seed.id,
        amount: seed.escrowAmount ?? 0,
        status: seed.escrowStatus,
        heldAt:
          seed.escrowStatus !== "pending"
            ? new Date(Date.now() - (seed.daysAgo - 1) * dayMs).toISOString()
            : undefined,
        releasedAt:
          seed.escrowStatus === "released"
            ? new Date(Date.now() - Math.floor(seed.daysAgo / 2) * dayMs).toISOString()
            : undefined,
      };
      db.escrows[escrowId] = escrow;
    }
  }

  db.seeded = true;
  saveDb(db);
}

// ── Stats derivation ─────────────────────────────────────────────────────────

function deriveStats(db: ScrapDb): ScrapStats {
  const requests = Object.values(db.partRequests);
  const openStatuses: PartRequestStatus[] = ["new", "quoted", "accepted", "shipped"];
  const openRequestsCount = requests.filter((r) => openStatuses.includes(r.status)).length;

  const escrowHeldAmount = Object.values(db.escrows)
    .filter((e) => e.status === "held")
    .reduce((sum, e) => sum + e.amount, 0);

  const completedDealsCount = requests.filter((r) => r.status === "completed").length;

  return { openRequestsCount, escrowHeldAmount, completedDealsCount };
}

// ── Param helpers ─────────────────────────────────────────────────────────────

function safeParam(params: URLSearchParams, key: string): string | undefined {
  const v = params.get(key);
  return v === null || v === "" || v === "undefined" || v === "null" ? undefined : v;
}

function safeInt(params: URLSearchParams, key: string, fallback: number): number {
  const v = safeParam(params, key);
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function tryScrapMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const raw = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  if (!raw.startsWith("scrap/")) return null;

  const db = loadDb();
  seedIfEmpty(db);

  let path = raw;
  let queryString = "";
  if (raw.includes("?")) {
    const parts = raw.split("?");
    path = parts[0];
    queryString = parts[1] ?? "";
  }

  const params = new URLSearchParams(queryString);

  // ── GET /scrap/profile ────────────────────────────────────────────────────
  if (path === "scrap/profile" && method === "get") {
    if (!db.profile) throw fail(config, 404, "NOT_FOUND", "Scrap profile not found");
    return ok(config, db.profile);
  }

  // ── PUT /scrap/profile ────────────────────────────────────────────────────
  if (path === "scrap/profile" && method === "put") {
    if (!db.profile) throw fail(config, 404, "NOT_FOUND", "Scrap profile not found");
    const payload = parseBody(config.data) as Partial<ScrapProfile>;
    const now = new Date().toISOString();
    db.profile = {
      ...db.profile,
      ...(payload.companyName !== undefined ? { companyName: payload.companyName } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.bannerUrl !== undefined ? { bannerUrl: payload.bannerUrl } : {}),
      ...(payload.photos !== undefined ? { photos: payload.photos } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.specializations !== undefined
        ? { specializations: payload.specializations }
        : {}),
      ...(payload.contact !== undefined ? { contact: payload.contact } : {}),
      ...(payload.workingHoursLabel !== undefined
        ? { workingHoursLabel: payload.workingHoursLabel }
        : {}),
      updatedAt: now,
    };
    saveDb(db);
    return ok(config, db.profile);
  }

  // ── GET /scrap/subscription ───────────────────────────────────────────────
  if (path === "scrap/subscription" && method === "get") {
    if (!db.subscription) throw fail(config, 404, "NOT_FOUND", "No active subscription");
    return ok(config, db.subscription);
  }

  // ── POST /scrap/subscription/renew ────────────────────────────────────────
  if (path === "scrap/subscription/renew" && method === "post") {
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

  // ── GET /scrap/stats ──────────────────────────────────────────────────────
  if (path === "scrap/stats" && method === "get") {
    return ok(config, deriveStats(db));
  }

  // ── GET /scrap/part-requests ──────────────────────────────────────────────
  if (path === "scrap/part-requests" && method === "get") {
    const page = safeInt(params, "page", 1);
    const pageSize = safeInt(params, "pageSize", 10);
    const statusFilter = safeParam(params, "status");
    const search = safeParam(params, "search")?.toLowerCase();

    let items = Object.values(db.partRequests);

    if (statusFilter && statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter);
    }
    if (search) {
      items = items.filter(
        (r) =>
          r.partName.toLowerCase().includes(search) ||
          r.requestNumber.toLowerCase().includes(search) ||
          r.customerName.toLowerCase().includes(search),
      );
    }

    items = items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const sliced = items.slice((page - 1) * pageSize, page * pageSize);

    const response: PaginatedResponse<PartRequest> = {
      items: sliced,
      page,
      pageSize,
      total,
      totalPages,
    };
    return ok(config, response);
  }

  // ── GET /scrap/part-requests/:id ──────────────────────────────────────────
  const partRequestMatch = path.match(/^scrap\/part-requests\/([^/]+)$/);
  if (partRequestMatch && method === "get") {
    const id = partRequestMatch[1];
    const pr = db.partRequests[id];
    if (!pr) throw fail(config, 404, "NOT_FOUND", "Part request not found");
    return ok(config, pr);
  }

  // ── POST /scrap/part-requests/:id/offer ───────────────────────────────────
  const offerMatch = path.match(/^scrap\/part-requests\/([^/]+)\/offer$/);
  if (offerMatch && method === "post") {
    const id = offerMatch[1];
    const pr = db.partRequests[id];
    if (!pr) throw fail(config, 404, "NOT_FOUND", "Part request not found");
    if (pr.status !== "new") {
      throw fail(config, 400, "INVALID_STATUS", "Offer can only be submitted on new requests");
    }
    const payload = parseBody(config.data) as unknown as SubmitOfferPayload;
    const escrowId = `esc_${id}`;

    db.partRequests[id] = { ...pr, status: "quoted", escrowId };
    db.escrows[escrowId] = {
      id: escrowId,
      partRequestId: id,
      amount: payload.price,
      status: "pending",
    };
    saveDb(db);
    return ok(config, db.partRequests[id]);
  }

  // ── PATCH /scrap/part-requests/:id/status ─────────────────────────────────
  const statusMatch = path.match(/^scrap\/part-requests\/([^/]+)\/status$/);
  if (statusMatch && method === "patch") {
    const id = statusMatch[1];
    const pr = db.partRequests[id];
    if (!pr) throw fail(config, 404, "NOT_FOUND", "Part request not found");

    const body = parseBody(config.data);
    const newStatus = body.status as PartRequestStatus;

    if (!canPartRequestTransition(pr.status, newStatus)) {
      throw fail(
        config,
        400,
        "INVALID_TRANSITION",
        `Cannot transition from ${pr.status} to ${newStatus}`,
      );
    }

    db.partRequests[id] = { ...pr, status: newStatus };

    // When shipped → hold escrow if pending
    if (newStatus === "shipped" && pr.escrowId) {
      const escrow = db.escrows[pr.escrowId];
      if (escrow && escrow.status === "pending") {
        db.escrows[pr.escrowId] = {
          ...escrow,
          status: "held",
          heldAt: new Date().toISOString(),
        };
      }
    }

    saveDb(db);
    return ok(config, db.partRequests[id]);
  }

  // ── GET /scrap/escrow/:partRequestId ──────────────────────────────────────
  const escrowMatch = path.match(/^scrap\/escrow\/([^/]+)$/);
  if (escrowMatch && method === "get") {
    const partRequestId = escrowMatch[1];
    const pr = db.partRequests[partRequestId];
    if (!pr?.escrowId) {
      throw fail(config, 404, "NOT_FOUND", "No escrow for this part request");
    }
    const escrow = db.escrows[pr.escrowId];
    if (!escrow) throw fail(config, 404, "NOT_FOUND", "Escrow not found");
    return ok(config, escrow);
  }

  return null;
}
