import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { createPendingProviderProfile } from "./providers.handlers";
import type { ProviderType } from "@modules/providers/types";

/**
 * In-process mock for the auth endpoints not yet confirmed live on the real
 * backend (register-provider, refresh-token, logout, users/me). Phone
 * login/verify and email login/register are all confirmed live and fall
 * through to the real backend untouched (see `tryAuthMock`).
 * The mock DB is persistent across reloads through localStorage.
 */

interface MockUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin" | "super_admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;
  providerStatus?: "pending" | "approved" | "rejected" | null;
  providerRejectionReason?: string | null;
  /**
   * Granular permission codes for RBAC.
   * Super-admin receives `["*"]` (wildcard → all permissions).
   * Regular users receive an empty array until role-specific
   * permission sets are defined on the backend.
   */
  permissions: string[];
}

/**
 * Returns the permission array for a newly-seeded mock user.
 * Super-admin receives the wildcard (`["*"]`); all other roles
 * receive an empty array until per-role permission sets are defined.
 */
function permissionsForRole(role: MockUser["role"]): string[] {
  if (role === "super_admin") return ["*"];
  return [];
}

/**
 * Maps the seed provider emails to their phone numbers so `POST /auth/login`
 * can bootstrap the same demo users the OTP flow seeds, when signing in
 * with an email that hasn't been seen by `readCurrentUser()`'s DB yet.
 */
const SEED_EMAILS: Record<string, string> = {
  "shamel@dealer.sa": "501110007",
  "toyota@workshop.sa": "501110008",
  "salam@scrap.sa": "501110010",
};

interface MockDB {
  users: Record<string, MockUser>;
}

const DB_KEY = "maqwad.mockDb";

function loadDb(): MockDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDB;
  } catch {
    /* ignore */
  }
  return { users: {} };
}

function saveDb(db: MockDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function makeTokens(): { accessToken: string; refreshToken: string } {
  return {
    accessToken: `mock.access.${Math.random().toString(36).slice(2, 12)}`,
    refreshToken: `mock.refresh.${Math.random().toString(36).slice(2, 12)}`,
  };
}

function ok<T>(config: InternalAxiosRequestConfig, data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: new AxiosHeaders(),
    config,
  };
}

function fail(config: InternalAxiosRequestConfig, status: number, code: string, message: string) {
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

/**
 * Try to resolve the current "logged-in" user from the Authorization header.
 * The mock issues opaque tokens but encodes the user id inside the access token.
 * For simplicity we read it from localStorage instead (set by setCredentials()).
 */
function readCurrentUser(): MockUser | null {
  try {
    const raw = localStorage.getItem("maqwad.user");
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

/**
 * Cross-mock helper: ensure a user reflects the latest state of their
 * provider profile (status/rejection reason) that lives in the
 * `maqwad.mockProvidersDb` blob. We only need to read this from the
 * providers mock without importing it directly, to keep the mocks
 * de-coupled.
 */
function syncProviderFields(user: MockUser): MockUser {
  if (user.role !== "provider" || !user.providerId) return user;
  try {
    const raw = localStorage.getItem("maqwad.mockProvidersDb");
    if (!raw) return user;
    const db = JSON.parse(raw) as {
      providers?: Record<string, { status?: MockUser["providerStatus"]; rejectionReason?: string | null }>;
    };
    const provider = db.providers?.[String(user.providerId)];
    if (!provider) return user;
    return {
      ...user,
      providerStatus: provider.status ?? user.providerStatus ?? null,
      providerRejectionReason: provider.rejectionReason ?? null,
    };
  } catch {
    return user;
  }
}

/**
 * Returns the mock response for an auth/users-me request, or `null`
 * if the URL is not handled here. `server.ts` composes this with
 * other handlers (vehicles, lookups, …) and finally falls through
 * to the real backend.
 */
export async function tryAuthMock(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url ?? "").replace(/^\/+|\/+$/g, "");
  const method = (config.method ?? "get").toLowerCase();

  // POST /auth/register (provider signup), POST /phone/login, and POST
  // /api/auth/phone/verify are all confirmed live on the real backend (see
  // Swagger) and are not under an always-mocked prefix, so they fall
  // through untouched — no handler needed for any of them here.

  // -- POST /auth/register-provider ------------------------------------------
  // Provider signup engine: create account + provider-profile record, then
  // auto-login (no OTP). See src/modules/auth/register/.
  if (url === "auth/register-provider" && method === "post") {
    const body = parseBody(config.data) as {
      providerType?: string;
      companyName?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    const providerType = body.providerType;
    const companyName = String(body.companyName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (providerType !== "workshop" && providerType !== "dealer" && providerType !== "scrap") {
      throw fail(config, 400, "VALIDATION", "نوع مقدّم الخدمة غير صحيح");
    }
    if (!companyName || companyName.length < 2) {
      throw fail(config, 400, "VALIDATION", "اسم المنشأة مطلوب");
    }
    if (!/^5\d{8}$/.test(phone)) {
      throw fail(config, 400, "VALIDATION", "رقم الجوال غير صحيح");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw fail(config, 400, "VALIDATION", "البريد الإلكتروني غير صحيح");
    }
    if (password.length < 6) {
      throw fail(config, 400, "VALIDATION", "كلمة المرور يجب ألا تقل عن 6 أحرف");
    }

    const db = loadDb();
    const emailTaken =
      Object.values(db.users).some((u) => u.email === email) ||
      Object.keys(SEED_EMAILS).includes(email);
    if (emailTaken) {
      throw fail(config, 409, "EMAIL_TAKEN", "هذا البريد الإلكتروني مستخدم بالفعل");
    }

    const userId = makeId("usr");
    const profile = createPendingProviderProfile({
      userId,
      type: providerType as ProviderType,
      companyName,
      email,
      phone,
    });

    const user: MockUser = {
      id: userId,
      phoneNumber: phone,
      fullName: companyName,
      email,
      role: "provider",
      avatarUrl: null,
      isProfileComplete: true,
      providerId: profile.id,
      providerStatus: "pending",
      providerRejectionReason: null,
      permissions: permissionsForRole("provider"),
    };
    db.users[user.id] = user;
    saveDb(db);
    localStorage.setItem("maqwad.user", JSON.stringify(user));

    const tokens = makeTokens();
    return ok(config, { ...tokens, user }, 201);
  }

  // -- POST /auth/login -------------------------------------------------
  // PEELED — the real backend's /auth/login is confirmed live and wired
  // via authApi.login + auth.adapter.ts. Returning null here falls through
  // to the real backend instead of the mock DB. Every other handler in
  // this file stays mocked (register-provider, OTP, users/me, ...) since
  // those endpoints aren't built/confirmed on the backend yet.
  if (url === "auth/login" && method === "post") {
    return null;
  }

  // -- POST /auth/refresh-token --------------------------------------------
  if (url === "auth/refresh-token" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_INVALID", "الجلسة منتهية");
    return ok(config, makeTokens());
  }

  // -- POST /auth/logout ----------------------------------------------------
  if (url === "auth/logout" && method === "post") {
    return ok(config, { success: true });
  }

  // -- GET /users/me --------------------------------------------------------
  if (url === "users/me" && method === "get") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    return ok(config, syncProviderFields(me));
  }

  // -- PUT /users/me --------------------------------------------------------
  if (url === "users/me" && method === "put") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    const body = parseBody(config.data) as Partial<MockUser>;
    const db = loadDb();
    const updated: MockUser = {
      ...me,
      fullName: body.fullName ?? me.fullName,
      email: body.email ?? me.email ?? null,
      // Don't allow the client to escalate to admin / super_admin via this endpoint.
      role:
        (body.role === "admin" || body.role === "super_admin") &&
        me.role !== "admin" && me.role !== "super_admin"
          ? me.role
          : ((body.role as MockUser["role"]) ?? me.role),
      permissions: me.permissions,
      isProfileComplete: Boolean(body.fullName && (body.role ?? me.role)),
    };
    db.users[updated.id] = updated;
    saveDb(db);
    localStorage.setItem("maqwad.user", JSON.stringify(updated));
    return ok(config, syncProviderFields(updated));
  }

  // -- POST /users/me/avatar ------------------------------------------------
  if (url === "users/me/avatar" && method === "post") {
    const me = readCurrentUser();
    if (!me) throw fail(config, 401, "AUTH_REQUIRED", "غير مصرّح");
    const db = loadDb();
    const updated = { ...me, avatarUrl: `mock://avatar/${me.id}` };
    db.users[updated.id] = updated;
    saveDb(db);
    localStorage.setItem("maqwad.user", JSON.stringify(updated));
    return ok(config, updated);
  }

  // Not ours — let the next handler / real backend deal with it.
  return null;
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
