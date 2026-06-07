import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

/**
 * In-process mock for /auth/* and /users/me endpoints.
 * The shape mirrors what the .NET backend should return once the
 * MVP-spec endpoints are implemented (see backend_message.md / Excel plan).
 *
 * For the MVP demo:
 *   - Any 9-digit phone starting with 5 is "valid".
 *   - Any 6-digit code that ends with the last 6 digits of the phone passes,
 *     or simply the literal string "123456".
 *   - The mock is persistent across reloads through localStorage.
 */

interface MockUser {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: "customer" | "provider" | "driver" | "admin";
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;
  providerStatus?: "pending" | "approved" | "rejected" | null;
  providerRejectionReason?: string | null;
}

/**
 * Demo-only convenience: signing in with these phone numbers
 * spins up a pre-seeded user with the matching role so testers
 * can quickly switch between dashboards. Remove (or guard with
 * `import.meta.env.DEV`) once a real backend takes over.
 */
function defaultRoleForPhone(phone: string): MockUser["role"] {
  if (phone === "500000000") return "admin";
  return "customer";
}

interface MockDB {
  users: Record<string, MockUser>;
  /** verificationId -> phoneNumber */
  verifications: Record<string, string>;
}

const DB_KEY = "maqwad.mockDb";

function loadDb(): MockDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDB;
  } catch {
    /* ignore */
  }
  return { users: {}, verifications: {} };
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

  // -- POST /auth/register --------------------------------------------------
  if (url === "auth/register" && method === "post") {
    const body = parseBody(config.data);
    const phone = String(body.phoneNumber ?? "");
    if (!/^5\d{8}$/.test(phone)) {
      throw fail(config, 400, "INVALID_PHONE", "رقم الجوال غير صحيح");
    }
    const db = loadDb();
    const verificationId = makeId("ver");
    db.verifications[verificationId] = phone;
    saveDb(db);
    return ok(config, { verificationId, resendAfter: 60 });
  }

  // -- POST /auth/verify-otp ------------------------------------------------
  if (url === "auth/verify-otp" && method === "post") {
    const body = parseBody(config.data);
    const verificationId = String(body.verificationId ?? "");
    const code = String(body.code ?? "");
    const db = loadDb();
    const phone = db.verifications[verificationId];
    if (!phone) throw fail(config, 400, "INVALID_VERIFICATION", "انتهت صلاحية الجلسة");
    const accepted = code === "123456" || code === phone.slice(-6);
    if (!accepted) throw fail(config, 400, "INVALID_OTP", "الرمز غير صحيح");

    let user = Object.values(db.users).find((u) => u.phoneNumber === phone);
    if (!user) {
      const role = defaultRoleForPhone(phone);
      user = {
        id: makeId("usr"),
        phoneNumber: phone,
        fullName: role === "admin" ? "مسؤول النظام" : "",
        email: null,
        role,
        avatarUrl: null,
        // Admin demo accounts skip the profile-completion screen.
        isProfileComplete: role === "admin",
        providerId: null,
        providerStatus: null,
        providerRejectionReason: null,
      };
      db.users[user.id] = user;
    }
    delete db.verifications[verificationId];
    saveDb(db);

    const tokens = makeTokens();
    return ok(config, { ...tokens, user });
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
      // Don't allow the client to escalate to admin via this endpoint.
      role:
        body.role === "admin" && me.role !== "admin"
          ? me.role
          : ((body.role as MockUser["role"]) ?? me.role),
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
