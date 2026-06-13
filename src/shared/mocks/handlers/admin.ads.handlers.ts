/**
 * @file In-process mock for /admin/ad-placements and /admin/ad-campaigns endpoints.
 *
 * @module shared/mocks/handlers/admin.ads.handlers
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AdPlacement, AdCampaign } from "@modules/ads/types";

// =============================================================================
// Local types — shape of the current user stored in localStorage
// =============================================================================

interface CurrentUser {
  id: string;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  permissions?: string[];
}

// =============================================================================
// Mock data
// =============================================================================

let SEED_PLACEMENTS: AdPlacement[] = [
  {
    id: 1,
    code: "provider_profile_banner",
    nameAr: "بانر ملف المزود",
    nameEn: "Provider Profile Banner",
    descriptionAr: "يظهر في أعلى صفحة ملف المزود",
    descriptionEn: "Appears at the top of the provider profile page",
    isActive: true,
  },
  {
    id: 2,
    code: "vehicle_save_offer",
    nameAr: "عرض حفظ المركبة",
    nameEn: "Vehicle Save Offer",
    descriptionAr: "يظهر بعد إضافة المستخدم لمركبة جديدة",
    descriptionEn: "Appears after a user adds a new vehicle",
    isActive: true,
  },
  {
    id: 3,
    code: "marketplace_slot",
    nameAr: "مكان المتجر",
    nameEn: "Marketplace Slot",
    descriptionAr: "إعلان يظهر ضمن قسم المتجر",
    descriptionEn: "Ad appearing within the marketplace section",
    isActive: false,
  },
];

let SEED_CAMPAIGNS: AdCampaign[] = [
  {
    id: 1,
    titleAr: "حملة الصيف المذهلة",
    titleEn: "Amazing Summer Campaign",
    descriptionAr: "خصومات الصيف بدأت الآن",
    descriptionEn: "Summer discounts started now",
    imageUrl: "mock://images/summer.png",
    targetUrl: "https://example.com/summer",
    placementId: 1,
    startsAt: "2023-06-01T00:00:00Z",
    endsAt: "2023-08-31T23:59:59Z",
    status: "ended",
    priority: 10,
    createdAt: "2023-05-15T10:00:00Z",
  },
  {
    id: 2,
    titleAr: "عرض الشتاء الترويجي",
    titleEn: "Winter Promo Offer",
    descriptionAr: "عروض لا تفوت لفصل الشتاء",
    descriptionEn: "Unmissable offers for winter",
    imageUrl: "mock://images/winter.png",
    targetUrl: "https://example.com/winter",
    placementId: 2,
    startsAt: "2026-11-01T00:00:00Z",
    endsAt: "2027-02-28T23:59:59Z",
    status: "scheduled",
    priority: 5,
    createdAt: "2026-05-10T11:00:00Z",
  },
  {
    id: 3,
    titleAr: "صيانة مجانية",
    titleEn: "Free Maintenance",
    descriptionAr: "احصل على صيانة مجانية عند تغيير الزيت",
    descriptionEn: "Get free maintenance with oil change",
    imageUrl: "mock://images/maintenance.png",
    targetUrl: "https://example.com/free",
    placementId: 1,
    startsAt: "2026-06-01T00:00:00Z",
    endsAt: "2026-07-31T23:59:59Z",
    status: "active",
    priority: 20,
    createdAt: "2026-05-20T09:00:00Z",
  },
  {
    id: 4,
    titleAr: "تخفيضات العودة للمدارس",
    titleEn: "Back to School Sale",
    descriptionAr: "تجهيزات المدارس بأفضل الأسعار",
    descriptionEn: "School supplies at the best prices",
    imageUrl: "mock://images/school.png",
    targetUrl: "https://example.com/school",
    placementId: 3,
    startsAt: "2026-08-15T00:00:00Z",
    endsAt: "2026-09-15T23:59:59Z",
    status: "paused",
    priority: 1,
    createdAt: "2026-06-01T08:00:00Z",
  },
];

// =============================================================================
// Response helpers
// =============================================================================

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return { data, status, statusText: "OK", headers: new AxiosHeaders(), config };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string): Error & { isAxiosError: boolean; response: AxiosResponse; config: InternalAxiosRequestConfig } {
  const err = new Error(message) as Error & { isAxiosError: boolean; response: AxiosResponse; config: InternalAxiosRequestConfig };
  err.isAxiosError = true;
  err.config = config;
  err.response = { data: { code, message }, status, statusText: "Error", headers: new AxiosHeaders(), config };
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

function requireAdmin(config: InternalAxiosRequestConfig): CurrentUser {
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

export async function tryAdminAdsMock(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/ad-placements ------------------------------------------------
  if (url === "admin/ad-placements" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const isActiveParam = params["isActive"] as string | undefined;

    let filtered = SEED_PLACEMENTS;
    if (isActiveParam !== undefined) {
      const isActive = isActiveParam === "true";
      filtered = filtered.filter(p => p.isActive === isActive);
    }
    return ok(config, filtered);
  }

  // -- GET /admin/ad-placements/:id --------------------------------------------
  if (url.startsWith("admin/ad-placements/") && method === "get") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const placement = SEED_PLACEMENTS.find(p => p.id === id);
    if (!placement) throw fail(config, 404, "NOT_FOUND", "الموضع غير موجود");
    return ok(config, placement);
  }

  // -- POST /admin/ad-placements -----------------------------------------------
  if (url === "admin/ad-placements" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = Math.max(0, ...SEED_PLACEMENTS.map(p => p.id)) + 1;
    const newPlacement: AdPlacement = {
      id: newId,
      code: payload.code,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      descriptionAr: payload.descriptionAr,
      descriptionEn: payload.descriptionEn,
      isActive: payload.isActive ?? true,
    };
    SEED_PLACEMENTS.push(newPlacement);
    return ok(config, newPlacement);
  }

  // -- PUT /admin/ad-placements/:id --------------------------------------------
  if (url.startsWith("admin/ad-placements/") && method === "put") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PLACEMENTS.findIndex(p => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الموضع غير موجود");

    const payload = JSON.parse(config.data || "{}");
    SEED_PLACEMENTS[idx] = { ...SEED_PLACEMENTS[idx], ...payload };
    return ok(config, SEED_PLACEMENTS[idx]);
  }

  // -- DELETE /admin/ad-placements/:id -----------------------------------------
  if (url.startsWith("admin/ad-placements/") && method === "delete") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_PLACEMENTS.findIndex(p => p.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الموضع غير موجود");

    SEED_PLACEMENTS.splice(idx, 1);
    return ok(config, { success: true });
  }

  // -- GET /admin/ad-campaigns -------------------------------------------------
  if (url === "admin/ad-campaigns" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    const statusParam = params["status"] as string | undefined;
    const placementIdParam = params["placementId"] ? Number(params["placementId"]) : undefined;

    let filtered = SEED_CAMPAIGNS;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter(c => c.status === statusParam);
    }
    if (placementIdParam !== undefined && !isNaN(placementIdParam)) {
      filtered = filtered.filter(c => c.placementId === placementIdParam);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<AdCampaign> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- GET /admin/ad-campaigns/:id ---------------------------------------------
  if (url.startsWith("admin/ad-campaigns/") && method === "get") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const campaign = SEED_CAMPAIGNS.find(c => c.id === id);
    if (!campaign) throw fail(config, 404, "NOT_FOUND", "الحملة غير موجودة");
    return ok(config, campaign);
  }

  // -- POST /admin/ad-campaigns ------------------------------------------------
  if (url === "admin/ad-campaigns" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = Math.max(0, ...SEED_CAMPAIGNS.map(c => c.id)) + 1;
    const newCampaign: AdCampaign = {
      id: newId,
      titleAr: payload.titleAr,
      titleEn: payload.titleEn,
      descriptionAr: payload.descriptionAr,
      descriptionEn: payload.descriptionEn,
      imageUrl: payload.imageUrl,
      targetUrl: payload.targetUrl,
      placementId: payload.placementId,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      status: payload.status || "draft",
      priority: payload.priority,
      createdAt: new Date().toISOString(),
    };
    
    SEED_CAMPAIGNS = [newCampaign, ...SEED_CAMPAIGNS];
    return ok(config, newCampaign);
  }

  // -- PUT /admin/ad-campaigns/:id ---------------------------------------------
  if (url.startsWith("admin/ad-campaigns/") && method === "put") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_CAMPAIGNS.findIndex(c => c.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الحملة غير موجودة");

    const payload = JSON.parse(config.data || "{}");
    SEED_CAMPAIGNS[idx] = { ...SEED_CAMPAIGNS[idx], ...payload };
    return ok(config, SEED_CAMPAIGNS[idx]);
  }

  // -- DELETE /admin/ad-campaigns/:id ------------------------------------------
  if (url.startsWith("admin/ad-campaigns/") && method === "delete") {
    requireAdmin(config);
    const id = Number(url.split("/")[2]);
    const idx = SEED_CAMPAIGNS.findIndex(c => c.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "الحملة غير موجودة");

    SEED_CAMPAIGNS.splice(idx, 1);
    return ok(config, { success: true });
  }

  return null;
}
