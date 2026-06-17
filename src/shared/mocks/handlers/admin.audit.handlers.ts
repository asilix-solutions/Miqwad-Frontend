/**
 * @file In-process mock for /admin/audit-logs endpoints.
 *
 * @module shared/mocks/handlers/admin.audit.handlers
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { AuditLogEntry } from "@modules/audit/types";

// =============================================================================
// Local types
// =============================================================================

interface CurrentUser {
  id: string;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  permissions?: string[];
}

// =============================================================================
// Mock data
// =============================================================================

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 1,
    actorId: "admin-1",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "login",
    module: "auth",
    summaryAr: "تسجيل الدخول للنظام",
    summaryEn: "System login",
    ipAddress: "192.168.1.1",
    createdAt: "2026-06-13T08:00:00Z",
  },
  {
    id: 2,
    actorId: "admin-1",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "approve",
    module: "providers",
    entityType: "ProviderProfile",
    entityId: "12",
    summaryAr: "الموافقة على ملف المزود #12",
    summaryEn: "Approved provider profile #12",
    metadata: {
      providerName: "Test Provider",
    },
    ipAddress: "192.168.1.1",
    createdAt: "2026-06-13T08:15:00Z",
  },
  {
    id: 3,
    actorId: "admin-2",
    actorName: "Support Admin",
    actorRole: "admin",
    action: "resolve",
    module: "disputes",
    entityType: "Dispute",
    entityId: "45",
    summaryAr: "تم حل النزاع #45 وإرجاع المبلغ للعميل",
    summaryEn: "Resolved dispute #45 and refunded customer",
    metadata: {
      decision: "refund_to_customer",
      note: "Customer provided proof",
    },
    ipAddress: "10.0.0.5",
    createdAt: "2026-06-12T14:30:00Z",
  },
  {
    id: 4,
    actorId: "admin-1",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "update",
    module: "settings",
    entityType: "SystemSettings",
    entityId: "general",
    summaryAr: "تحديث إعدادات النظام العامة",
    summaryEn: "Updated general system settings",
    metadata: {
      changes: {
        supportEmail: "support@maqwad.com",
      },
    },
    ipAddress: "192.168.1.1",
    createdAt: "2026-06-11T09:20:00Z",
  },
  {
    id: 5,
    actorId: "admin-1",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "send",
    module: "notifications",
    entityType: "Notification",
    summaryAr: "إرسال إشعار ترويجي للعملاء",
    summaryEn: "Sent promotional notification to customers",
    metadata: {
      audience: "customers",
      channel: "push",
    },
    ipAddress: "192.168.1.1",
    createdAt: "2026-06-10T11:00:00Z",
  },
  {
    id: 6,
    actorId: "admin-2",
    actorName: "Support Admin",
    actorRole: "admin",
    action: "create",
    module: "ads",
    entityType: "AdCampaign",
    entityId: "1",
    summaryAr: "إنشاء حملة إعلانية جديدة",
    summaryEn: "Created new ad campaign",
    ipAddress: "10.0.0.5",
    createdAt: "2026-06-09T15:45:00Z",
  },
  {
    id: 7,
    actorId: "admin-2",
    actorName: "Support Admin",
    actorRole: "admin",
    action: "suspend",
    module: "users",
    entityType: "User",
    entityId: "89",
    summaryAr: "إيقاف حساب المستخدم #89 بسبب مخالفة الشروط",
    summaryEn: "Suspended user #89 for terms violation",
    metadata: {
      reason: "Spamming",
    },
    ipAddress: "10.0.0.5",
    createdAt: "2026-06-08T10:10:00Z",
  },

];

for (let i = 9; i <= 24; i++) {
  SEED_AUDIT_LOGS.push({
    id: i,
    actorId: "admin-1",
    actorName: "Super Admin",
    actorRole: "super_admin",
    action: "update",
    module: "users",
    entityType: "User",
    entityId: `${i * 10}`,
    summaryAr: `تحديث بيانات المستخدم #${i * 10}`,
    summaryEn: `Updated user data #${i * 10}`,
    ipAddress: "192.168.1.1",
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  });
}

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

// FUTURE: recordAuditEvent(entry: Omit<AuditLogEntry, "id" | "createdAt">): void
// This helper will be used by other handlers to push a real audit entry when an admin
// action occurs, once the backend is wired.
// export function recordAuditEvent(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
//   SEED_AUDIT_LOGS.unshift({
//     ...entry,
//     id: Math.max(0, ...SEED_AUDIT_LOGS.map(l => l.id)) + 1,
//     createdAt: new Date().toISOString()
//   });
// }

// =============================================================================
// Handler
// =============================================================================

export async function tryAdminAuditMock(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/audit-logs ---------------------------------------------------
  if (url === "admin/audit-logs" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    
    const module = params["module"] as string | undefined;
    const action = params["action"] as string | undefined;
    const actorId = params["actorId"] as string | undefined;
    const dateFrom = params["dateFrom"] as string | undefined;
    const dateTo = params["dateTo"] as string | undefined;
    const search = params["search"] as string | undefined;

    let filtered = [...SEED_AUDIT_LOGS];

    if (module) filtered = filtered.filter(l => l.module === module);
    if (action) filtered = filtered.filter(l => l.action === action);
    if (actorId) filtered = filtered.filter(l => l.actorId === actorId);
    if (dateFrom) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(dateTo));
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l => 
        l.summaryAr.toLowerCase().includes(q) || 
        l.summaryEn.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<AuditLogEntry> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- GET /admin/audit-logs/export --------------------------------------------
  if (url === "admin/audit-logs/export" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    
    const module = params["module"] as string | undefined;
    const action = params["action"] as string | undefined;
    const actorId = params["actorId"] as string | undefined;
    const dateFrom = params["dateFrom"] as string | undefined;
    const dateTo = params["dateTo"] as string | undefined;
    const search = params["search"] as string | undefined;

    let filtered = [...SEED_AUDIT_LOGS];

    if (module) filtered = filtered.filter(l => l.module === module);
    if (action) filtered = filtered.filter(l => l.action === action);
    if (actorId) filtered = filtered.filter(l => l.actorId === actorId);
    if (dateFrom) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(dateFrom));
    if (dateTo) filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(dateTo));
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(l => 
        l.summaryAr.toLowerCase().includes(q) || 
        l.summaryEn.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const csvRows = [
      "ID,Date,Actor,Action,Module,Summary",
      ...filtered.map(l => `${l.id},${l.createdAt},"${l.actorName}",${l.action},${l.module},"${l.summaryEn}"`)
    ];
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    return ok(config, blob);
  }

  return null;
}
