/**
 * @file In-process mock for /admin/settings endpoints.
 *
 * @module shared/mocks/handlers/admin.settings.handlers
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { SystemSettings } from "@modules/settings/types";

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

let SETTINGS: SystemSettings = {
  general: {
    platformNameAr: "مقود",
    platformNameEn: "Maqwad",
    logoUrl: "https://example.com/logo.png",
    supportEmail: "support@maqwad.com",
    supportPhone: "0500000000",
    defaultCurrency: "SAR",
    defaultLanguage: "ar",
    timezone: "Asia/Riyadh",
  },
  business: {
    defaultCommissionRate: 15,
    minWithdrawalAmount: 100,
    settlementHoldDays: 3,
    escrowAutoReleaseDays: 7,
  },
  contact: {
    termsUrlAr: "https://maqwad.com/terms",
    termsUrlEn: "https://maqwad.com/en/terms",
    privacyUrlAr: "https://maqwad.com/privacy",
    privacyUrlEn: "https://maqwad.com/en/privacy",
    twitterUrl: "https://twitter.com/maqwad",
    instagramUrl: "https://instagram.com/maqwad",
    whatsappNumber: "966500000000",
  },
  featureFlags: [
    {
      key: "ads_enabled",
      labelAr: "تفعيل الإعلانات",
      labelEn: "Enable Ads",
      descriptionAr: "إظهار الإعلانات في التطبيق",
      descriptionEn: "Show ads in the application",
      enabled: true,
    },
    {
      key: "subscriptions_enabled",
      labelAr: "تفعيل الاشتراكات",
      labelEn: "Enable Subscriptions",
      descriptionAr: "السماح للمزودين بالاشتراك",
      descriptionEn: "Allow providers to subscribe",
      enabled: true,
    },
    {
      key: "provider_self_registration",
      labelAr: "تسجيل المزودين الذاتي",
      labelEn: "Provider Self Registration",
      descriptionAr: "السماح للمزودين بالتسجيل من التطبيق",
      descriptionEn: "Allow providers to register from the app",
      enabled: true,
    },
    {
      key: "maintenance_mode",
      labelAr: "وضع الصيانة",
      labelEn: "Maintenance Mode",
      descriptionAr: "إيقاف التطبيق للصيانة",
      descriptionEn: "Stop application for maintenance",
      enabled: false,
    },
  ],
};

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

export async function tryAdminSettingsMock(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/settings -----------------------------------------------------
  if (url === "admin/settings" && method === "get") {
    requireAdmin(config);
    return ok(config, SETTINGS);
  }

  // -- PUT /admin/settings/:section --------------------------------------------
  if (url.startsWith("admin/settings/") && method === "put") {
    requireAdmin(config);
    const section = url.split("/")[2] as keyof SystemSettings;
    
    if (!SETTINGS[section]) {
      throw fail(config, 400, "INVALID_SECTION", "القسم غير صالح");
    }

    const payload = JSON.parse(config.data || "{}");
    
    if (section === "featureFlags") {
      // payload could be { flags: [...] } based on schema 
      if (Array.isArray(payload)) {
        SETTINGS.featureFlags = payload;
      } else if (payload && Array.isArray(payload.flags)) {
        SETTINGS.featureFlags = payload.flags;
      }
    } else {
      SETTINGS[section] = { ...SETTINGS[section], ...payload } as any;
    }

    return ok(config, SETTINGS);
  }

  return null;
}
