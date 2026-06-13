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
import type { SettlementRecord, EscrowTransaction, DisputeRecord, DisputeDetail } from "@modules/admin/types";
import type { Service, ServicePackage } from "@modules/services/types";
import type { SubscriptionPlan } from "@modules/subscriptions/types";

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

const SEED_SETTLEMENTS: SettlementRecord[] = [
  { id: "stl_1", providerId: "prv_1", providerName: "ورشة الإبداع", amount: 1500, status: "pending", requestedAt: "2025-06-10T08:00:00Z" },
  { id: "stl_2", providerId: "prv_2", providerName: "مركز العناية", amount: 45000, status: "approved", requestedAt: "2025-06-09T08:00:00Z", processedAt: "2025-06-10T09:00:00Z" },
  { id: "stl_3", providerId: "prv_3", providerName: "ورشة الصيانة السريعة", amount: 3200, status: "rejected", requestedAt: "2025-06-08T08:00:00Z", processedAt: "2025-06-09T10:00:00Z" },
  { id: "stl_4", providerId: "prv_4", providerName: "مركز الفحص الشامل", amount: 12500, status: "pending", requestedAt: "2025-06-11T07:30:00Z" },
  { id: "stl_5", providerId: "prv_5", providerName: "ورشة القمة", amount: 8900, status: "approved", requestedAt: "2025-06-05T08:00:00Z", processedAt: "2025-06-06T11:00:00Z" },
  { id: "stl_6", providerId: "prv_6", providerName: "مركز الأمان", amount: 2100, status: "pending", requestedAt: "2025-06-10T14:00:00Z" },
  { id: "stl_7", providerId: "prv_7", providerName: "ورشة المحركات", amount: 34000, status: "approved", requestedAt: "2025-06-01T08:00:00Z", processedAt: "2025-06-02T09:30:00Z" },
  { id: "stl_8", providerId: "prv_8", providerName: "مركز النخبة", amount: 5600, status: "rejected", requestedAt: "2025-06-07T08:00:00Z", processedAt: "2025-06-08T12:00:00Z" },
  { id: "stl_9", providerId: "prv_9", providerName: "ورشة الاعتماد", amount: 11200, status: "pending", requestedAt: "2025-06-11T09:00:00Z" },
  { id: "stl_10", providerId: "prv_10", providerName: "مركز الخبراء", amount: 18000, status: "approved", requestedAt: "2025-06-03T08:00:00Z", processedAt: "2025-06-04T15:00:00Z" },
];

const SEED_ESCROW: EscrowTransaction[] = [
  { id: "esc_1", orderId: "ord_101", amount: 1500, status: "held", createdAt: "2025-06-01T10:00:00Z" },
  { id: "esc_2", orderId: "ord_102", amount: 3200, status: "disputed", createdAt: "2025-06-02T11:00:00Z" },
  { id: "esc_3", orderId: "ord_103", amount: 800, status: "released", createdAt: "2025-06-03T09:00:00Z" },
  { id: "esc_4", orderId: "ord_104", amount: 4500, status: "refunded", createdAt: "2025-06-04T14:00:00Z" },
  { id: "esc_5", orderId: "ord_105", amount: 1200, status: "disputed", createdAt: "2025-06-05T16:00:00Z" },
];

const SEED_DISPUTES: DisputeDetail[] = [
  {
    id: "dsp_1", orderId: "ord_102", escrowTransactionId: "esc_2", openedByName: "فهد العتيبي", openedByRole: "customer", status: "open", amount: 3200, reason: "الخدمة لم تكتمل بالشكل المتفق عليه", createdAt: "2025-06-06T10:00:00Z",
    evidence: [{ id: "ev_1", fileUrl: "/mocks/ev1.jpg", fileName: "photo1.jpg", uploadedByRole: "customer", uploadedAt: "2025-06-06T10:05:00Z" }]
  },
  {
    id: "dsp_2", orderId: "ord_105", escrowTransactionId: "esc_5", openedByName: "ورشة الإبداع", openedByRole: "provider", status: "under_review", amount: 1200, reason: "العميل يرفض استلام السيارة بعد الإصلاح", createdAt: "2025-06-07T12:00:00Z", evidence: []
  },
  {
    id: "dsp_3", orderId: "ord_106", escrowTransactionId: "esc_6", openedByName: "نورة الشمري", openedByRole: "customer", status: "resolved", amount: 2500, reason: "تأخير كبير في التسليم", createdAt: "2025-06-01T09:00:00Z", resolvedAt: "2025-06-03T15:00:00Z", resolution: { decision: "refund_to_customer", note: "تم التأكد من التأخير وإرجاع المبلغ للعميل" }, evidence: []
  },
  {
    id: "dsp_4", orderId: "ord_107", escrowTransactionId: "esc_7", openedByName: "خالد القحطاني", openedByRole: "customer", status: "open", amount: 500, reason: "قطعة الغيار غير أصلية", createdAt: "2025-06-08T10:00:00Z", evidence: []
  },
  {
    id: "dsp_5", orderId: "ord_108", escrowTransactionId: "esc_8", openedByName: "مركز العناية", openedByRole: "provider", status: "under_review", amount: 8500, reason: "تم إنجاز العمل والعميل لا يتجاوب", createdAt: "2025-06-09T11:00:00Z", evidence: []
  },
  {
    id: "dsp_6", orderId: "ord_109", escrowTransactionId: "esc_9", openedByName: "سارة الدوسري", openedByRole: "customer", status: "resolved", amount: 1400, reason: "اللون مختلف عن المطلوب", createdAt: "2025-05-20T10:00:00Z", resolvedAt: "2025-05-22T10:00:00Z", resolution: { decision: "partial_refund", partialAmount: 700, note: "اتفاق على نصف المبلغ" }, evidence: []
  },
  {
    id: "dsp_7", orderId: "ord_110", escrowTransactionId: "esc_10", openedByName: "عبدالله المالكي", openedByRole: "customer", status: "open", amount: 2000, reason: "مشكلة مستمرة بعد الإصلاح", createdAt: "2025-06-10T09:00:00Z", evidence: []
  },
  {
    id: "dsp_8", orderId: "ord_111", escrowTransactionId: "esc_11", openedByName: "ورشة الصيانة السريعة", openedByRole: "provider", status: "open", amount: 900, reason: "العميل يطالب بأشياء خارج الاتفاق", createdAt: "2025-06-11T08:00:00Z", evidence: []
  },
  {
    id: "dsp_9", orderId: "ord_112", escrowTransactionId: "esc_12", openedByName: "ريم الحربي", openedByRole: "customer", status: "under_review", amount: 3300, reason: "صوت غريب بعد الصيانة", createdAt: "2025-06-09T14:00:00Z", evidence: []
  },
  {
    id: "dsp_10", orderId: "ord_113", escrowTransactionId: "esc_13", openedByName: "محمد السبيعي", openedByRole: "customer", status: "open", amount: 4100, reason: "ضرر بالسيارة أثناء تواجدها بالورشة", createdAt: "2025-06-11T12:00:00Z", evidence: []
  }
];

let SEED_SERVICES: Service[] = [
  { id: 1, nameAr: "غسيل خارجي", nameEn: "Exterior Wash", categoryId: 1, basePrice: 50, isActive: true },
  { id: 2, nameAr: "تلميع داخلي", nameEn: "Interior Detailing", categoryId: 1, basePrice: 150, isActive: true },
  { id: 3, nameAr: "تغيير زيت المحرك", nameEn: "Engine Oil Change", categoryId: 2, basePrice: 200, isActive: true, estimatedDuration: 30 },
  { id: 4, nameAr: "فحص كمبيوتر", nameEn: "Computer Diagnostics", categoryId: 3, basePrice: 100, isActive: true },
  { id: 5, nameAr: "تبديل بطارية", nameEn: "Battery Replacement", categoryId: 4, basePrice: 50, isActive: true },
  { id: 6, nameAr: "وزن أذرعة", nameEn: "Wheel Alignment", categoryId: 5, basePrice: 120, isActive: true },
  { id: 7, nameAr: "تعبئة فريون", nameEn: "AC Freon Recharge", categoryId: 6, basePrice: 150, isActive: false },
  { id: 8, nameAr: "صيانة دورية", nameEn: "Periodic Maintenance", categoryId: 2, basePrice: 500, isActive: false, descriptionAr: "تشمل الفلاتر والزيوت", descriptionEn: "Includes filters and oils" },
];

let SEED_PACKAGES: ServicePackage[] = [
  { id: 1, nameAr: "الباقة الشاملة", nameEn: "Comprehensive Package", serviceIds: [1, 2, 8], price: 650, isActive: true, descriptionAr: "غسيل، تلميع وصيانة شاملة بسعر مخفض", descriptionEn: "Wash, detailing, and periodic maintenance at a discounted rate" },
  { id: 2, nameAr: "باقة الفحص السريع", nameEn: "Quick Inspection Package", serviceIds: [4, 5], price: 130, isActive: true },
  { id: 3, nameAr: "باقة الصيف", nameEn: "Summer Package", serviceIds: [1, 7], price: 180, isActive: false },
  { id: 4, nameAr: "باقة الزيت والفلاتر", nameEn: "Oil and Filters Package", serviceIds: [3, 8], price: 650, isActive: true },
  { id: 5, nameAr: "الباقة الأساسية", nameEn: "Basic Package", serviceIds: [1, 3], price: 230, isActive: true },
];

let SEED_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    nameAr: "الأساسية",
    nameEn: "Basic",
    price: 99,
    billingCycle: "monthly",
    features: [
      { id: "feat_1", labelAr: "إدراج في الدليل", labelEn: "Directory listing" },
      { id: "feat_2", labelAr: "دعم فني عادي", labelEn: "Standard support" }
    ],
    isActive: true,
  },
  {
    id: 2,
    nameAr: "الاحترافية",
    nameEn: "Pro",
    price: 199,
    billingCycle: "monthly",
    features: [
      { id: "feat_3", labelAr: "ظهور متقدم", labelEn: "Featured placement" },
      { id: "feat_4", labelAr: "دعم فني أولوية", labelEn: "Priority support" },
      { id: "feat_5", labelAr: "تقارير متقدمة", labelEn: "Advanced analytics" }
    ],
    isActive: true,
  },
  {
    id: 3,
    nameAr: "الاحترافية (سنوي)",
    nameEn: "Pro (Yearly)",
    price: 1990,
    billingCycle: "yearly",
    features: [
      { id: "feat_6", labelAr: "ظهور متقدم", labelEn: "Featured placement" },
      { id: "feat_7", labelAr: "دعم فني أولوية", labelEn: "Priority support" },
      { id: "feat_8", labelAr: "تقارير متقدمة", labelEn: "Advanced analytics" },
      { id: "feat_9", labelAr: "شهرين مجاناً", labelEn: "Two months free" }
    ],
    isActive: true,
  },
  {
    id: 4,
    nameAr: "المميزة",
    nameEn: "Premium",
    price: 299,
    billingCycle: "monthly",
    features: [
      { id: "feat_10", labelAr: "حساب مدير مخصص", labelEn: "Dedicated account manager" },
      { id: "feat_11", labelAr: "ظهور في الصفحة الرئيسية", labelEn: "Homepage placement" }
    ],
    isActive: false,
  }
];


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

  // -- GET /admin/settlements -------------------------------------------------
  if (url === "admin/settlements" && method === "get") {
    requireAdmin(config);

    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    const statusParam = params["status"] as string | undefined;

    let filtered = SEED_SETTLEMENTS;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter((s) => s.status === statusParam);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<SettlementRecord> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- POST /admin/settlements/:id/approve ------------------------------------
  if (url.startsWith("admin/settlements/") && url.endsWith("/approve") && method === "post") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const idx = SEED_SETTLEMENTS.findIndex((s) => s.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "التسوية غير موجودة");

    SEED_SETTLEMENTS[idx] = {
      ...SEED_SETTLEMENTS[idx],
      status: "approved",
      processedAt: new Date().toISOString(),
    };
    return ok(config, SEED_SETTLEMENTS[idx]);
  }

  // -- POST /admin/settlements/:id/reject -------------------------------------
  if (url.startsWith("admin/settlements/") && url.endsWith("/reject") && method === "post") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const idx = SEED_SETTLEMENTS.findIndex((s) => s.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "التسوية غير موجودة");

    // The user's prompt mentions accepting `{ reason: string }` but we just mutate status here.
    SEED_SETTLEMENTS[idx] = {
      ...SEED_SETTLEMENTS[idx],
      status: "rejected",
      processedAt: new Date().toISOString(),
    };
    return ok(config, SEED_SETTLEMENTS[idx]);
  }


  // -- GET /admin/disputes -------------------------------------------------
  if (url === "admin/disputes" && method === "get") {
    requireAdmin(config);

    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    const statusParam = params["status"] as string | undefined;

    let filtered = SEED_DISPUTES;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter((d) => d.status === statusParam);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    // Map to omit evidence for the list view
    const items = filtered.slice(startIdx, startIdx + pageSize).map(({ evidence, ...rest }) => rest as DisputeRecord);

    const response: PaginatedResponse<DisputeRecord> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- GET /admin/disputes/:id -------------------------------------------------
  if (url.startsWith("admin/disputes/") && method === "get" && !url.includes("/resolve")) {
    requireAdmin(config);
    const id = url.split("/")[2];
    const dispute = SEED_DISPUTES.find((d) => d.id === id);
    if (!dispute) throw fail(config, 404, "NOT_FOUND", "النزاع غير موجود");
    
    return ok(config, dispute);
  }

  // -- POST /admin/disputes/:id/resolve -------------------------------------------------
  if (url.startsWith("admin/disputes/") && url.endsWith("/resolve") && method === "post") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const idx = SEED_DISPUTES.findIndex((d) => d.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "النزاع غير موجود");

    const payload = JSON.parse(config.data || "{}");
    const { decision, note, partialAmount } = payload;

    if (decision === "partial_refund") {
      if (typeof partialAmount !== "number" || partialAmount <= 0 || partialAmount > SEED_DISPUTES[idx].amount) {
         throw fail(config, 422, "VALIDATION_ERROR", "قيمة الاسترجاع الجزئي غير صحيحة");
      }
    }

    SEED_DISPUTES[idx] = {
      ...SEED_DISPUTES[idx],
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolution: {
        decision,
        note,
        ...(decision === "partial_refund" ? { partialAmount } : {})
      }
    };

    // Also update linked escrow if exists
    const escIdx = SEED_ESCROW.findIndex((e) => e.id === SEED_DISPUTES[idx].escrowTransactionId);
    if (escIdx !== -1) {
      if (decision === "release_to_provider") {
        SEED_ESCROW[escIdx] = { ...SEED_ESCROW[escIdx], status: "released" };
      } else if (decision === "refund_to_customer" || decision === "partial_refund") {
        SEED_ESCROW[escIdx] = { ...SEED_ESCROW[escIdx], status: "refunded" };
      }
    }

    return ok(config, SEED_DISPUTES[idx]);
  }

  // -- GET /admin/escrow -------------------------------------------------
  if (url === "admin/escrow" && method === "get") {
    requireAdmin(config);

    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    const statusParam = params["status"] as string | undefined;

    let filtered = SEED_ESCROW;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter((e) => e.status === statusParam);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<EscrowTransaction> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

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
    const newService: Service = {
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

  // -- GET /admin/packages ---------------------------------------------------
  if (url === "admin/packages" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const isActiveParam = params["isActive"] as string | undefined;

    let filtered = SEED_PACKAGES;
    if (isActiveParam !== undefined) {
      const isActive = isActiveParam === "true";
      filtered = filtered.filter(p => p.isActive === isActive);
    }

    return ok(config, filtered);
  }

  // -- GET /admin/packages/:id -----------------------------------------------
  if (url.startsWith("admin/packages/") && method === "get") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const pkg = SEED_PACKAGES.find(p => p.id === id);
    if (!pkg) throw fail(config, 404, "NOT_FOUND", "الباقة غير موجودة");
    return ok(config, pkg);
  }

  // -- POST /admin/packages --------------------------------------------------
  if (url === "admin/packages" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = Math.max(0, ...SEED_PACKAGES.map(p => p.id)) + 1;
    const newPackage: ServicePackage = {
      id: newId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      serviceIds: payload.serviceIds || [],
      price: payload.price,
      isActive: payload.isActive ?? true,
      descriptionAr: payload.descriptionAr ?? null,
      descriptionEn: payload.descriptionEn ?? null,
      sortOrder: payload.sortOrder ?? null,
    };
    SEED_PACKAGES.push(newPackage);
    return ok(config, newPackage);
  }

  // -- PUT /admin/packages/:id -----------------------------------------------
  if (url.startsWith("admin/packages/") && method === "put") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PACKAGES.findIndex((p) => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الباقة غير موجودة");

    const payload = JSON.parse(config.data || "{}");
    SEED_PACKAGES[idx] = { ...SEED_PACKAGES[idx], ...payload };
    return ok(config, SEED_PACKAGES[idx]);
  }

  // -- DELETE /admin/packages/:id --------------------------------------------
  if (url.startsWith("admin/packages/") && method === "delete") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PACKAGES.findIndex((p) => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الباقة غير موجودة");

    SEED_PACKAGES.splice(idx, 1);
    return ok(config, { success: true });
  }

  // -- GET /admin/plans ---------------------------------------------------
  if (url === "admin/plans" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const isActiveParam = params["isActive"] as string | undefined;

    let filtered = SEED_PLANS;
    if (isActiveParam !== undefined) {
      const isActive = isActiveParam === "true";
      filtered = filtered.filter(p => p.isActive === isActive);
    }

    return ok(config, filtered);
  }

  // -- GET /admin/plans/:id -----------------------------------------------
  if (url.startsWith("admin/plans/") && method === "get") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const plan = SEED_PLANS.find(p => p.id === id);
    if (!plan) throw fail(config, 404, "NOT_FOUND", "الخطة غير موجودة");
    return ok(config, plan);
  }

  // -- POST /admin/plans --------------------------------------------------
  if (url === "admin/plans" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = Math.max(0, ...SEED_PLANS.map(p => p.id)) + 1;
    const newPlan: SubscriptionPlan = {
      id: newId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      descriptionAr: payload.descriptionAr ?? null,
      descriptionEn: payload.descriptionEn ?? null,
      price: payload.price,
      billingCycle: payload.billingCycle,
      features: payload.features || [],
      isActive: payload.isActive ?? true,
      sortOrder: payload.sortOrder ?? null,
    };
    SEED_PLANS.push(newPlan);
    return ok(config, newPlan);
  }

  // -- PUT /admin/plans/:id -----------------------------------------------
  if (url.startsWith("admin/plans/") && method === "put") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PLANS.findIndex((p) => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الخطة غير موجودة");

    const payload = JSON.parse(config.data || "{}");
    SEED_PLANS[idx] = { ...SEED_PLANS[idx], ...payload };
    return ok(config, SEED_PLANS[idx]);
  }

  // -- DELETE /admin/plans/:id --------------------------------------------
  if (url.startsWith("admin/plans/") && method === "delete") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PLANS.findIndex((p) => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الخطة غير موجودة");

    SEED_PLANS.splice(idx, 1);
    return ok(config, { success: true });
  }

  // Not ours — let the next handler / real backend deal with it.
  return null;
}
