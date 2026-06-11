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
interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  pendingVerifications: number;
  openDisputes: number;
  monthlyRevenue: number;
}

const MOCK_STATS: DashboardStats = {
  totalUsers: 1_247,
  activeProviders: 83,
  pendingVerifications: 12,
  openDisputes: 5,
  monthlyRevenue: 284_500,
};

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
    return ok(config, MOCK_STATS);
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
  if (url.startsWith("admin/users/") && method === "get" && !url.includes("/suspend") && !url.includes("/restore")) {
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

  // -- POST /admin/users/:id/suspend ------------------------------------------
  if (url.startsWith("admin/users/") && url.endsWith("/suspend") && method === "post") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const userIdx = SEED_USERS.findIndex((u) => u.id === id);
    if (userIdx === -1) throw fail(config, 404, "NOT_FOUND", "المستخدم غير موجود");
    
    // Mutate in-memory mock state
    SEED_USERS[userIdx] = { ...SEED_USERS[userIdx], status: "suspended" };
    return ok(config, SEED_USERS[userIdx]);
  }

  // -- POST /admin/users/:id/restore ------------------------------------------
  if (url.startsWith("admin/users/") && url.endsWith("/restore") && method === "post") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const userIdx = SEED_USERS.findIndex((u) => u.id === id);
    if (userIdx === -1) throw fail(config, 404, "NOT_FOUND", "المستخدم غير موجود");
    
    // Mutate in-memory mock state
    SEED_USERS[userIdx] = { ...SEED_USERS[userIdx], status: "active" };
    return ok(config, SEED_USERS[userIdx]);
  }

  // Not ours — let the next handler / real backend deal with it.
  return null;
}
