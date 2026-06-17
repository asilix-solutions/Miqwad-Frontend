/**
 * @file In-process mock for /admin/complaints endpoints.
 *
 * @module shared/mocks/handlers/admin.complaints.handlers
 */

import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Complaint, ComplaintStatus } from "@modules/complaints/types";

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

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "comp-1",
    customerName: "أحمد عبدالله",
    title: "تأخر في وصول مزود الخدمة",
    body: "قمت بطلب خدمة نقل عفش وتأخر المزود أكثر من ساعتين عن الموعد المحدد بدون أي اعتذار أو تواصل.",
    status: "new",
    createdAt: "2026-06-16T10:00:00Z",
  },
  {
    id: "comp-2",
    customerName: "سارة محمد",
    title: "سلوك غير لائق من المندوب",
    body: "المندوب كان يتحدث بطريقة غير لائقة ورفض توصيل الطلب إلى الباب كما هو متفق عليه.",
    status: "under_review",
    createdAt: "2026-06-15T14:30:00Z",
  },
  {
    id: "comp-3",
    customerName: "خالد سعيد",
    title: "الخدمة غير مطابقة للوصف",
    body: "طلبت خدمة تنظيف شاملة ولكن المزود قام بتنظيف سطحي فقط ولم يكمل العمل المتفق عليه.",
    status: "resolved",
    createdAt: "2026-06-14T09:15:00Z",
  },
  {
    id: "comp-4",
    customerName: "مريم علي",
    title: "تطبيق معلق أثناء الدفع",
    body: "تم سحب المبلغ من بطاقتي ولكن التطبيق يظهر أن الدفع فشل والطلب لم يتم تأكيده.",
    status: "new",
    createdAt: "2026-06-16T18:45:00Z",
  },
  {
    id: "comp-5",
    customerName: "عمر حسن",
    title: "تسعيرة أعلى من المتفق عليه",
    body: "بعد الانتهاء من العمل طلب المزود مبلغ إضافي بحجة أن العمل استغرق وقت أطول من المتوقع.",
    status: "under_review",
    createdAt: "2026-06-13T11:20:00Z",
  },
  {
    id: "comp-6",
    customerName: "نورة القحطاني",
    title: "تلف في الممتلكات",
    body: "أثناء نقل الأثاث تم خدش التلفاز بشكل واضح، والمزود يرفض تحمل المسؤولية.",
    status: "new",
    createdAt: "2026-06-17T08:10:00Z",
  },
  {
    id: "comp-7",
    customerName: "فهد الدوسري",
    title: "عدم تجاوب الدعم الفني",
    body: "حاولت التواصل مع الدعم الفني أكثر من مرة بخصوص مشكلة في حسابي ولم أجد أي رد منذ يومين.",
    status: "resolved",
    createdAt: "2026-06-10T15:00:00Z",
  },
  {
    id: "comp-8",
    customerName: "ليلى الشهراني",
    title: "المزود لم يحضر",
    body: "حجزت موعد لخدمة الصيانة والمزود لم يحضر ولم يتواصل معي لإلغاء الموعد.",
    status: "under_review",
    createdAt: "2026-06-12T13:40:00Z",
  },
  {
    id: "comp-9",
    customerName: "يوسف المطيري",
    title: "جودة سيئة للمنتجات",
    body: "المنتجات المستخدمة في التنظيف كانت ذات جودة رديئة وتسببت في حساسية للأطفال في المنزل.",
    status: "new",
    createdAt: "2026-06-16T20:25:00Z",
  },
  {
    id: "comp-10",
    customerName: "هند العتيبي",
    title: "صعوبة في استخدام التطبيق",
    body: "تحديث التطبيق الأخير جعل عملية الحجز صعبة جداً وهناك الكثير من الأخطاء التقنية.",
    status: "resolved",
    createdAt: "2026-06-05T09:50:00Z",
  },
  {
    id: "comp-11",
    customerName: "عبدالرحمن الشمري",
    title: "إلغاء الطلب بدون سبب",
    body: "تم إلغاء طلبي من قبل المزود قبل الموعد بنصف ساعة بدون توضيح أي أسباب.",
    status: "under_review",
    createdAt: "2026-06-14T16:15:00Z",
  },
  {
    id: "comp-12",
    customerName: "ريم الغامدي",
    title: "مشكلة في التقييم",
    body: "لا أستطيع تقييم المزود بعد انتهاء الخدمة، التطبيق يغلق تلقائياً.",
    status: "new",
    createdAt: "2026-06-17T11:05:00Z",
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

export async function tryAdminComplaintsMock(config: InternalAxiosRequestConfig): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // -- GET /admin/complaints ---------------------------------------------------
  if (url === "admin/complaints" && method === "get") {
    requireAdmin(config);
    const params = (config.params ?? {}) as Record<string, unknown>;
    const page = Math.max(1, Number(params["page"] ?? 1));
    const pageSize = Math.max(1, Math.min(100, Number(params["pageSize"] ?? 10)));
    
    const status = params["status"] as ComplaintStatus | undefined;
    const search = params["search"] as string | undefined;

    let filtered = [...SEED_COMPLAINTS];

    if (status && status !== "all" as any) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.customerName.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const items = filtered.slice(startIdx, startIdx + pageSize);

    const response: PaginatedResponse<Complaint> = {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };

    return ok(config, response);
  }

  // -- PATCH /admin/complaints/:id/status -------------------------------------
  const patchMatch = url.match(/^admin\/complaints\/(comp-\d+)\/status$/);
  if (patchMatch && method === "patch") {
    requireAdmin(config);
    const id = patchMatch[1];
    
    let bodyData: any = {};
    if (typeof config.data === "string") {
      try { bodyData = JSON.parse(config.data); } catch { /* ignore */ }
    } else {
      bodyData = config.data || {};
    }
    
    const newStatus = bodyData.status as ComplaintStatus;
    
    if (!["new", "under_review", "resolved"].includes(newStatus)) {
      throw fail(config, 400, "INVALID_STATUS", "حالة غير صالحة");
    }

    const complaintIdx = SEED_COMPLAINTS.findIndex(c => c.id === id);
    if (complaintIdx === -1) {
      throw fail(config, 404, "NOT_FOUND", "الشكوى غير موجودة");
    }

    SEED_COMPLAINTS[complaintIdx] = {
      ...SEED_COMPLAINTS[complaintIdx],
      status: newStatus,
    };

    return ok(config, SEED_COMPLAINTS[complaintIdx]);
  }

  // -- PUT /admin/complaints/:id/status -------------------------------------
  const putMatch = url.match(/^admin\/complaints\/(comp-\d+)\/status$/);
  if (putMatch && method === "put") {
    requireAdmin(config);
    const id = putMatch[1];
    
    let bodyData: any = {};
    if (typeof config.data === "string") {
      try { bodyData = JSON.parse(config.data); } catch { /* ignore */ }
    } else {
      bodyData = config.data || {};
    }
    
    const newStatus = bodyData.status as ComplaintStatus;
    
    if (!["new", "under_review", "resolved"].includes(newStatus)) {
      throw fail(config, 400, "INVALID_STATUS", "حالة غير صالحة");
    }

    const complaintIdx = SEED_COMPLAINTS.findIndex(c => c.id === id);
    if (complaintIdx === -1) {
      throw fail(config, 404, "NOT_FOUND", "الشكوى غير موجودة");
    }

    SEED_COMPLAINTS[complaintIdx] = {
      ...SEED_COMPLAINTS[complaintIdx],
      status: newStatus,
    };

    return ok(config, SEED_COMPLAINTS[complaintIdx]);
  }

  return null;
}
