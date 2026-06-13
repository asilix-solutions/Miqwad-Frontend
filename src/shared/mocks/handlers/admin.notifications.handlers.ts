/**
 * @file In-process mock for /admin/notifications/* and /admin/notification-templates/* endpoints.
 *
 * @module shared/mocks/handlers/admin.notifications.handlers
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { NotificationTemplate, SentNotification } from "@modules/notifications/types";

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

let SEED_TEMPLATES: NotificationTemplate[] = [
  {
    id: "tpl_1",
    nameAr: "ترحيب مزود",
    nameEn: "New Provider Welcome",
    titleAr: "أهلاً بك في مقود",
    titleEn: "Welcome to Maqwad",
    bodyAr: "مرحباً {{userName}}، تم تفعيل حسابك كـ {{serviceName}} بنجاح.",
    bodyEn: "Hello {{userName}}, your account as a {{serviceName}} has been activated.",
    variables: ["userName", "serviceName"],
    channel: "email",
    isActive: true,
  },
  {
    id: "tpl_2",
    nameAr: "تذكير بالموعد",
    nameEn: "Appointment Reminder",
    titleAr: "تذكير بموعد الصيانة",
    titleEn: "Maintenance Appointment Reminder",
    bodyAr: "عزيزي {{userName}}، نذكرك بموعدك القادم غداً الساعة {{time}}.",
    bodyEn: "Dear {{userName}}, your next appointment is tomorrow at {{time}}.",
    variables: ["userName", "time"],
    channel: "sms",
    isActive: true,
  },
  {
    id: "tpl_3",
    nameAr: "عروض الصيف",
    nameEn: "Summer Offers",
    titleAr: "خصومات الصيف بدأت!",
    titleEn: "Summer Discounts Started!",
    bodyAr: "احصل على خصم {{discount}}% على خدمات {{serviceCategory}}.",
    bodyEn: "Get a {{discount}}% discount on {{serviceCategory}} services.",
    variables: ["discount", "serviceCategory"],
    channel: "push",
    isActive: true,
  },
  {
    id: "tpl_4",
    nameAr: "تنبيه إداري",
    nameEn: "System Alert",
    titleAr: "تحديثات النظام",
    titleEn: "System Updates",
    bodyAr: "سيتم تحديث النظام يوم {{date}}، قد تتأثر بعض الخدمات مؤقتاً.",
    bodyEn: "System will be updated on {{date}}, some services may be temporarily affected.",
    variables: ["date"],
    channel: "in_app",
    isActive: false,
  },
  {
    id: "tpl_5",
    nameAr: "إشعار الدفع",
    nameEn: "Payment Notification",
    titleAr: "تم استلام دفعتك",
    titleEn: "Payment Received",
    bodyAr: "تم استلام مبلغ {{amount}} بنجاح بخصوص الفاتورة {{invoiceNo}}.",
    bodyEn: "Payment of {{amount}} received successfully for invoice {{invoiceNo}}.",
    variables: ["amount", "invoiceNo"],
    channel: "email",
    isActive: true,
  },
];

let SEED_SENT_NOTIFICATIONS: SentNotification[] = [
  { id: "sent_1", templateId: "tpl_1", titleAr: "أهلاً بك في مقود", titleEn: "Welcome to Maqwad", bodyAr: "مرحباً خالد، تم تفعيل حسابك كـ مزود بنجاح.", bodyEn: "Hello Khalid, your account as a Provider has been activated.", audience: "providers", channel: "email", status: "sent", sentAt: "2025-06-12T10:00:00Z", recipientsCount: 1 },
  { id: "sent_2", templateId: "tpl_3", titleAr: "خصومات الصيف بدأت!", titleEn: "Summer Discounts Started!", bodyAr: "احصل على خصم 20% على خدمات الغسيل.", bodyEn: "Get a 20% discount on Wash services.", audience: "customers", channel: "push", status: "sent", sentAt: "2025-06-11T12:00:00Z", recipientsCount: 450 },
  { id: "sent_3", templateId: null, titleAr: "صيانة عاجلة", titleEn: "Urgent Maintenance", bodyAr: "نعتذر، هناك صيانة طارئة في التطبيق.", bodyEn: "Sorry, there is urgent maintenance in the app.", audience: "all", channel: "in_app", status: "pending", sentAt: "2025-06-13T08:00:00Z", recipientsCount: 1200 },
  { id: "sent_4", templateId: "tpl_5", titleAr: "تم استلام دفعتك", titleEn: "Payment Received", bodyAr: "تم استلام مبلغ 1500 بنجاح بخصوص الفاتورة INV-001.", bodyEn: "Payment of 1500 received successfully for invoice INV-001.", audience: "providers", channel: "email", status: "sent", sentAt: "2025-06-10T09:30:00Z", recipientsCount: 1 },
  { id: "sent_5", templateId: "tpl_2", titleAr: "تذكير بموعد الصيانة", titleEn: "Maintenance Appointment Reminder", bodyAr: "عزيزي فهد، نذكرك بموعدك القادم غداً الساعة 10:00 صباحاً.", bodyEn: "Dear Fahad, your next appointment is tomorrow at 10:00 AM.", audience: "customers", channel: "sms", status: "failed", sentAt: "2025-06-09T15:00:00Z", recipientsCount: 1 },
  { id: "sent_6", templateId: "tpl_1", titleAr: "أهلاً بك في مقود", titleEn: "Welcome to Maqwad", bodyAr: "مرحباً ورشة الإبداع، تم تفعيل حسابك كـ مركز صيانة بنجاح.", bodyEn: "Hello Al-Ibdaa Workshop, your account as a Maintenance Center has been activated.", audience: "providers", channel: "email", status: "sent", sentAt: "2025-06-08T11:00:00Z", recipientsCount: 1 },
  { id: "sent_7", templateId: null, titleAr: "تحديث الشروط والأحكام", titleEn: "Terms and Conditions Update", bodyAr: "تم تحديث الشروط والأحكام، يرجى المراجعة.", bodyEn: "Terms and conditions have been updated, please review.", audience: "all", channel: "in_app", status: "sent", sentAt: "2025-06-07T14:00:00Z", recipientsCount: 1500 },
  { id: "sent_8", templateId: "tpl_3", titleAr: "خصومات الصيف بدأت!", titleEn: "Summer Discounts Started!", bodyAr: "احصل على خصم 15% على خدمات الفحص.", bodyEn: "Get a 15% discount on Inspection services.", audience: "customers", channel: "push", status: "sent", sentAt: "2025-06-06T10:00:00Z", recipientsCount: 320 },
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

export async function tryAdminNotificationsMock(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/notification-templates ---------------------------------------
  if (url === "admin/notification-templates" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const isActiveParam = params["isActive"] as string | undefined;

    let filtered = SEED_TEMPLATES;
    if (isActiveParam !== undefined) {
      const isActive = isActiveParam === "true";
      filtered = filtered.filter(t => t.isActive === isActive);
    }
    return ok(config, filtered);
  }

  // -- GET /admin/notification-templates/:id -----------------------------------
  if (url.startsWith("admin/notification-templates/") && method === "get") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const template = SEED_TEMPLATES.find(t => t.id === id);
    if (!template) throw fail(config, 404, "NOT_FOUND", "القالب غير موجود");
    return ok(config, template);
  }

  // -- POST /admin/notification-templates --------------------------------------
  if (url === "admin/notification-templates" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    const newId = `tpl_${Date.now()}`;
    const newTemplate: NotificationTemplate = {
      id: newId,
      nameAr: payload.nameAr,
      nameEn: payload.nameEn,
      titleAr: payload.titleAr,
      titleEn: payload.titleEn,
      bodyAr: payload.bodyAr,
      bodyEn: payload.bodyEn,
      variables: payload.variables || [],
      channel: payload.channel,
      isActive: payload.isActive ?? true,
    };
    SEED_TEMPLATES.push(newTemplate);
    return ok(config, newTemplate);
  }

  // -- PUT /admin/notification-templates/:id -----------------------------------
  if (url.startsWith("admin/notification-templates/") && method === "put") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const idx = SEED_TEMPLATES.findIndex(t => t.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "القالب غير موجود");

    const payload = JSON.parse(config.data || "{}");
    SEED_TEMPLATES[idx] = { ...SEED_TEMPLATES[idx], ...payload };
    return ok(config, SEED_TEMPLATES[idx]);
  }

  // -- DELETE /admin/notification-templates/:id --------------------------------
  if (url.startsWith("admin/notification-templates/") && method === "delete") {
    requireAdmin(config);
    const id = url.split("/")[2];
    const idx = SEED_TEMPLATES.findIndex(t => t.id === id);
    if (idx === -1) throw fail(config, 404, "NOT_FOUND", "القالب غير موجود");

    SEED_TEMPLATES.splice(idx, 1);
    return ok(config, { success: true });
  }

  // -- POST /admin/notifications/send ------------------------------------------
  if (url === "admin/notifications/send" && method === "post") {
    requireAdmin(config);
    const payload = JSON.parse(config.data || "{}");
    
    // Mock recipients count based on audience
    let mockRecipientsCount = 1;
    if (payload.audience === "all") mockRecipientsCount = 2000;
    else if (payload.audience === "customers") mockRecipientsCount = 1500;
    else if (payload.audience === "providers") mockRecipientsCount = 500;

    const newSent: SentNotification = {
      id: `sent_${Date.now()}`,
      templateId: payload.templateId || null,
      titleAr: payload.titleAr,
      titleEn: payload.titleEn,
      bodyAr: payload.bodyAr,
      bodyEn: payload.bodyEn,
      audience: payload.audience,
      channel: payload.channel,
      status: "sent",
      sentAt: new Date().toISOString(),
      recipientsCount: mockRecipientsCount,
    };
    
    SEED_SENT_NOTIFICATIONS = [newSent, ...SEED_SENT_NOTIFICATIONS];
    return ok(config, newSent);
  }

  // -- GET /admin/notifications ------------------------------------------------
  if (url === "admin/notifications" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    const statusParam = params["status"] as string | undefined;

    let filtered = SEED_SENT_NOTIFICATIONS;
    if (statusParam && statusParam !== "all") {
      filtered = filtered.filter((s) => s.status === statusParam);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<SentNotification> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  return null;
}
