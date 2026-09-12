/**
 * @file In-process mock for /admin/* Super Admin Dashboard endpoints.
 *
 * Follows the same axios-interceptor pattern used by `auth.handlers.ts`
 * and `providers.handlers.ts`:
 *   1. Inspect `config.url` + `config.method`.
 *   2. Return an `AxiosResponse` if matched, or `null` to pass through.
 *   3. Shape helpers (`ok`, `fail`) produce Axios-compatible envelopes.
 *
 * ## Endpoints mocked
 *
 * | Method | Path                       | Description                              |
 * |--------|----------------------------|------------------------------------------|
 * | GET    | `/admin/me/permissions`    | Current mock user's permission codes     |
 * | GET    | `/admin/dashboard/stats`   | Stub KPI numbers for the dashboard       |
 * | GET    | `/admin/users`             | Paginated list of mock users             |
 * | POST   | `/admin/users`             | Create a client or provider account      |
 *
 * ## .NET swap plan
 *
 * These endpoints map 1-to-1 with the planned .NET Admin API:
 *   - `GET /admin/me/permissions`  → .NET `GET /api/admin/me/permissions`
 *   - `GET /admin/dashboard/stats` → .NET `GET /api/admin/dashboard/stats`
 *   - `GET /admin/users`           → .NET `GET /api/admin/users?page=&pageSize=`
 *
 * To swap: disable `VITE_USE_MOCKS` (or remove `tryAdminMock` from
 * `server.ts`).  Requests will fall through to the real API.  The
 * `PaginatedResponse<T>` shape defined in `src/shared/types/api.ts` is
 * the agreed contract — an adapter can normalise the real backend's
 * pagination fields (`Count`, `TotalRecords`, etc.) to this shape.
 *
 * @module shared/mocks/handlers/admin
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { DashboardStats } from "@modules/admin/types";
import type { PricedService } from "@modules/services/types";
import type { ProviderProfile } from "@modules/providers/types";
import type { RevenueSummary, RevenueRecord } from "@modules/admin/types";

// =============================================================================
// Local types — shape of the current user stored in localStorage
// =============================================================================

/**
 * Minimal projection of the user blob persisted in `maqwad.user`.
 * Kept local to avoid a hard import on the auth module, mirroring the
 * approach used by the providers handler.
 */
interface CurrentUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  permissions?: string[];
}

// =============================================================================
// Mock data — stub users for the /admin/users endpoint
// =============================================================================

/** Shape of each user record returned by `GET /admin/users`. */
interface AdminUserRecord {
  id: string;
  name: string;
  phone: string;
  role: CurrentUser["role"];
  status: "active" | "suspended" | "pending";
  /** Provider subtype ("workshop" | "dealer" | "scrapyard") when role === "provider". */
  providerType?: string;
  /** workshop/dealer/scrapyard: categories picked via CategoryMultiSelectTree, scoped by providerType. */
  categoryIds?: number[];
  /** workshop: free-text specialization (SRS: mechanics/bodywork, no closed list). */
  specialization?: string;
  /** scrapyard: closed set of ScrapVehicleBrand values (vehicle makes, orthogonal to categoryIds part categories). */
  brandSpecialization?: string[];
}

/**
 * Small seed set of fake users — just enough to build the Users table UI.
 * IDs are deterministic strings so snapshots/tests remain stable.
 */
const SEED_USERS: AdminUserRecord[] = [
  { id: "usr_a1b2c3d4", name: "فهد العتيبي",     phone: "512345001", role: "customer",    status: "active" },
  { id: "usr_e5f6g7h8", name: "نورة الشمري",     phone: "512345002", role: "customer",    status: "active" },
  { id: "usr_i9j0k1l2", name: "خالد القحطاني",    phone: "512345003", role: "provider",    status: "active" },
  { id: "usr_m3n4o5p6", name: "سارة الدوسري",    phone: "512345004", role: "provider",    status: "suspended" },
  { id: "usr_q7r8s9t0", name: "عبدالله المالكي",   phone: "512345005", role: "driver",      status: "active" },
  { id: "usr_u1v2w3x4", name: "ريم الحربي",      phone: "512345006", role: "customer",    status: "pending" },
  { id: "usr_y5z6a7b8", name: "محمد السبيعي",    phone: "512345007", role: "customer",    status: "active" },
  { id: "usr_c9d0e1f2", name: "هند العنزي",      phone: "512345008", role: "provider",    status: "active" },
  { id: "usr_g3h4i5j6", name: "عمر الغامدي",     phone: "512345009", role: "driver",      status: "active" },
  { id: "usr_k7l8m9n0", name: "لمى الزهراني",    phone: "512345010", role: "customer",    status: "suspended" },
];

/** Stub KPI data for the admin dashboard. */
const generateLast12Months = () => {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
};

const last12Months = generateLast12Months();

const MOCK_STATS: DashboardStats = {
  totalUsers: 1_247,
  activeProviders: 83,
  pendingVerifications: 12,
  monthlyRevenue: 284_500,
  trends: {
    totalUsers: +8.2,
    activeProviders: +3.1,
    pendingVerifications: -5.0,
    monthlyRevenue: +15.4,
  },
  usersSeries: last12Months.map((month, i) => ({
    month,
    value: 800 + (i * 40) + (i % 3 === 0 ? 15 : 0),
  })),
  providerStatusBreakdown: [
    { status: "approved", count: 83 },
    { status: "pending", count: 12 },
    { status: "rejected", count: 7 },
  ],
};

let SEED_SERVICES: PricedService[] = [
  { id: 1, nameAr: "غسيل خارجي",       nameEn: "Exterior Wash",          categoryId: 126, basePrice: 50,  isActive: true },
  { id: 2, nameAr: "تلميع داخلي",       nameEn: "Interior Detailing",      categoryId: 127, basePrice: 150, isActive: true },
  { id: 3, nameAr: "تغيير زيت المحرك",  nameEn: "Engine Oil Change",       categoryId: 111, basePrice: 200, isActive: true,  estimatedDuration: 30 },
  { id: 4, nameAr: "فحص كمبيوتر",       nameEn: "Computer Diagnostics",    categoryId: 116, basePrice: 100, isActive: true },
  { id: 5, nameAr: "تبديل بطارية",      nameEn: "Battery Replacement",     categoryId: 117, basePrice: 50,  isActive: true },
  { id: 6, nameAr: "وزن أذرعة",         nameEn: "Wheel Alignment",         categoryId: 123, basePrice: 120, isActive: true },
  { id: 7, nameAr: "تعبئة فريون",       nameEn: "AC Freon Recharge",       categoryId: 118, basePrice: 150, isActive: false },
  { id: 8, nameAr: "صيانة دورية",       nameEn: "Periodic Maintenance",    categoryId: 112, basePrice: 500, isActive: false, descriptionAr: "تشمل الفلاتر والزيوت", descriptionEn: "Includes filters and oils" },
];


// NOTE: Subscription plans + provider-subscription seeds/handlers were removed
// in Stage 1 of the live Subscriptions rebuild (feat/subscriptions-live). The
// real endpoints (/api/SubscriptionPlans, /api/ProviderSubscriptions) are hit
// directly by src/modules/subscriptions/ and are not mocked.


// =============================================================================
// Response helpers (identical pattern to auth / providers handlers)
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

function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  code: string,
  message: string,
): Error & { isAxiosError: boolean; response: AxiosResponse; config: InternalAxiosRequestConfig } {
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

// =============================================================================
// Helpers
// =============================================================================

function computeRevenue(): RevenueSummary {
  const records: RevenueRecord[] = [];
  let commissionTotal = 0;
  let subscriptionTotal = 0;

  // 1. Commission from dealers
  try {
    const rawProviders = localStorage.getItem("maqwad.mockProvidersDb");
    if (rawProviders) {
      const db = JSON.parse(rawProviders) as { providers: Record<number, ProviderProfile> };
      const providers = Object.values(db.providers || {});
      const dealers = providers.filter(p => p.type === "dealer");
      for (const d of dealers) {
        if (d.commissionRate != null && d.monthlySales != null) {
          const amount = d.monthlySales * (d.commissionRate / 100);
          records.push({
            id: `comm_${d.id}`,
            source: "commission",
            providerId: d.id,
            providerName: d.companyName,
            providerType: "dealer",
            amount,
            detail: `${d.commissionRate}% × ${d.monthlySales}`
          });
          commissionTotal += amount;
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  // 2. Subscriptions — provider-subscription seed removed in Stage 1 of the
  // live rebuild (feat/subscriptions-live). The revenue mock now reports only
  // dealer commissions until the real /api/ProviderSubscriptions data is wired
  // into this view in a later stage.

  return {
    totalMonthly: commissionTotal + subscriptionTotal,
    commissionTotal,
    subscriptionTotal,
    records
  };
}

function readCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("maqwad.user");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

/**
 * Guard: ensures the caller is an admin or super_admin.
 * Throws a `fail()` error on auth/role violations.
 */
function requireAdmin(
  config: InternalAxiosRequestConfig,
): CurrentUser {
  const me = readCurrentUser();
  if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
  if (me.role !== "admin" && me.role !== "super_admin") {
    throw fail(config, 403, "FORBIDDEN", "غير مسموح");
  }
  return me;
}

// =============================================================================
// Handler
// =============================================================================

/**
 * Returns the mock response for an `/admin/*` request, or `null`
 * if the URL is not handled here.  `server.ts` composes this with
 * other handlers (auth, vehicles, providers, …) and finally falls
 * through to the real backend.
 */
export async function tryAdminMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/me/permissions -----------------------------------------------
  // Returns the logged-in user's permission codes.
  // For super_admin this is ["*"]; for regular admins it would be a
  // subset once role-specific permission sets are defined.
  // .NET equivalent: GET /api/admin/me/permissions
  if (url === "admin/me/permissions" && method === "get") {
    const me = requireAdmin(config);
    return ok(config, { permissions: me.permissions ?? [] });
  }

  // -- GET /admin/dashboard/stats ---------------------------------------------
  // Returns stub KPI numbers for the dashboard overview cards.
  // .NET equivalent: GET /api/admin/dashboard/stats
  if (url === "admin/dashboard/stats" && method === "get") {
    requireAdmin(config);
    const total = computeRevenue().totalMonthly;
    
    // TODO: backend historical.
    const revenueSeries = last12Months.map((month, i) => ({
      month,
      value: Math.round(total * (0.55 + 0.45 * (i / 11)))
    }));

    return ok(config, {
      ...MOCK_STATS,
      monthlyRevenue: total,
      revenueSeries,
    });
  }

  // -- GET /admin/revenues ---------------------------------------------------
  if (url === "admin/revenues" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const sourceParam = params["source"] as string | undefined;

    const summary = computeRevenue();
    
    if (sourceParam && (sourceParam === "commission" || sourceParam === "subscription")) {
      summary.records = summary.records.filter(r => r.source === sourceParam);
    }
    
    return ok(config, summary);
  }

  // -- GET /admin/users -------------------------------------------------------
  // Returns a paginated stub list of mock users.
  // Supports `?page=1&pageSize=10` query params (defaults: page=1, pageSize=10).
  // .NET equivalent: GET /api/admin/users?page=&pageSize=
  if (url === "admin/users" && method === "get") {
    requireAdmin(config);

    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));

    const total = SEED_USERS.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = SEED_USERS.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<AdminUserRecord> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- GET /admin/users/:id ---------------------------------------------------
  if (url.startsWith("admin/users/") && method === "get") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const user = SEED_USERS.find((u) => u.id === id);
    if (!user) throw fail(config, 404, "NOT_FOUND", "المستخدم غير موجود");
    
    // AdminUserDetail stub
    const detail = {
      ...user,
      createdAt: new Date("2025-01-01T10:00:00Z").toISOString(),
      lastActiveAt: new Date().toISOString(),
      email: `${user.id}@example.com`,
      ordersCount: Math.floor(Math.random() * 50),
    };
    return ok(config, detail);
  }

  // -- POST /admin/users -------------------------------------------------------
  // Creates a user (client) or a provider account (workshop/dealer/scrapyard).
  // .NET equivalent: POST /api/admin/users
  if (url === "admin/users" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}") as { type: string; [key: string]: unknown };
    const id = `usr_${Math.random().toString(36).slice(2, 10)}`;

    const newUser: AdminUserRecord =
      payload.type === "client"
        ? {
            id,
            name: String(payload.name ?? ""),
            phone: String(payload.phoneNumber ?? ""),
            role: "customer",
            status: "active",
          }
        : {
            // workshop | dealer | scrapyard — all map to the "provider" role
            id,
            name: String(payload.companyName ?? ""),
            phone: String(payload.phoneNumber ?? ""),
            role: "provider",
            status: "pending",
            providerType: payload.type,
            ...(payload.type === "workshop"
              ? {
                  categoryIds: (payload.categoryIds as number[] | undefined) ?? [],
                  specialization: String(payload.specialization ?? ""),
                }
              : {}),
            ...(payload.type === "dealer"
              ? { categoryIds: (payload.categoryIds as number[] | undefined) ?? [] }
              : {}),
            ...(payload.type === "scrapyard"
              ? {
                  categoryIds: (payload.categoryIds as number[] | undefined) ?? [],
                  brandSpecialization: (payload.brandSpecialization as string[] | undefined) ?? [],
                }
              : {}),
          };

    SEED_USERS.push(newUser);
    return ok(config, newUser, 201);
  }

  // NOTE: user deactivate/reactivate moved to the real backend
  // (PATCH /api/Users/{id}/deactivate|activate) — no mock bridge.



  // -- GET /admin/services ---------------------------------------------------
  if (url === "admin/services" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const categoryId = params["categoryId"] ? Number(params["categoryId"]) : undefined;
    const isActiveParam = params["isActive"] as string | undefined;

    let filtered = SEED_SERVICES;
    if (categoryId) {
      filtered = filtered.filter(s => s.categoryId === categoryId);
    }
    if (isActiveParam !== undefined) {
      const isActive = isActiveParam === "true";
      filtered = filtered.filter(s => s.isActive === isActive);
    }

    return ok(config, filtered);
  }

  // -- POST /admin/services --------------------------------------------------
  if (url === "admin/services" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = Math.max(0, ...SEED_SERVICES.map(s => s.id)) + 1;
    const newService: PricedService = {
      id: newId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      categoryId: payload.categoryId,
      basePrice: payload.basePrice,
      estimatedDuration: payload.estimatedDuration ?? null,
      isActive: payload.isActive ?? true,
      descriptionAr: payload.descriptionAr ?? null,
      descriptionEn: payload.descriptionEn ?? null,
      sortOrder: payload.sortOrder ?? null,
    };
    SEED_SERVICES.push(newService);
    return ok(config, newService);
  }

  // -- PUT /admin/services/:id -----------------------------------------------
  if (url.startsWith("admin/services/") && method === "put") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_SERVICES.findIndex((s) => s.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الخدمة غير موجودة");

    const payload = JSON.parse(config.data || "{}");
    SEED_SERVICES[idx] = { ...SEED_SERVICES[idx], ...payload };
    return ok(config, SEED_SERVICES[idx]);
  }

  // -- DELETE /admin/services/:id --------------------------------------------
  if (url.startsWith("admin/services/") && method === "delete") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_SERVICES.findIndex((s) => s.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الخدمة غير موجودة");

    SEED_SERVICES.splice(idx, 1);
    return ok(config, { success: true });
  }



  // -- Subscription Plans + Provider Subscriptions ------------------------
  // Removed in Stage 1 of the live rebuild (feat/subscriptions-live). These
  // paths (/admin/plans, /admin/subscriptions) are dead — the section now
  // calls the real /api/SubscriptionPlans + /api/ProviderSubscriptions
  // endpoints directly from src/modules/subscriptions/.

  // Not ours — let the next handler / real backend deal with it.
  return null;
}
