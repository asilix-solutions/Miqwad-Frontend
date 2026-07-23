/**
 * @file auth.adapter.ts
 * @description PROVISIONAL — adapts the real backend's `/auth/login`
 * contract onto the frontend's `LoginResponse` shape (mirrors the NHTSA
 * adapter pattern). Two backend gaps drive this file's shape:
 *  - No refresh token yet: the backend issues a single `token` valid for
 *    ~60 minutes. `refreshToken` is adapted to `""` until one exists.
 *  - Role lives ONLY inside the JWT's Microsoft identity role claim, and
 *    was observed EMPTY on a live admin login. Decoding is defensive and
 *    falls back to a safe role rather than throwing.
 * See BACKEND_API_REQUIREMENTS.md (live-Swagger section) for the captured
 * contract this adapts.
 */
import { z } from "zod";
import type { LoginResponse, UserRole } from "../types";

const MS_ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

/**
 * Unwraps the backend's inconsistent envelope in one place: most endpoints
 * return `{ success, message, data }`, but `/auth/login` returns flat.
 */
export function unwrapEnvelope<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && "data" in (raw as Record<string, unknown>)) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  Customer: "customer",
  Provider: "provider",
  Dealer: "provider",
  Workshop: "provider",
  Scrap: "provider",
  Driver: "driver",
  Admin: "admin",
  SuperAdmin: "super_admin",
};

let warnedMissingRole = false;

/**
 * Decodes the MS identity role claim from a JWT and maps it to the
 * frontend `UserRole`. Missing/empty/unrecognized claims (a known backend
 * gap — observed empty on a live admin login) fall back to "customer"
 * instead of throwing, with a one-time console warning.
 */
export function decodeJwtRole(token: string): UserRole {
  const claim = decodeJwtPayload(token)?.[MS_ROLE_CLAIM];
  const raw = typeof claim === "string" ? claim.trim() : "";
  const mapped = BACKEND_ROLE_MAP[raw];
  if (mapped) return mapped;

  if (!warnedMissingRole) {
    warnedMissingRole = true;
    console.warn(
      `[auth.adapter] JWT role claim missing or unrecognized ("${raw}") — backend gap, defaulting to "customer".`,
    );
  }
  return "customer";
}

const rawLoginResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  fullName: z.string(),
  email: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  token: z.string(),
});

const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    email: z.string().nullable(),
    phoneNumber: z.string(),
    role: z.enum(["customer", "provider", "driver", "admin", "super_admin"]),
    avatarUrl: z.null(),
    isProfileComplete: z.boolean(),
  }),
});

/**
 * Adapts the real backend's flat `/auth/login` response into the existing
 * frontend `LoginResponse` contract. Zod-parses both the raw payload and
 * the adapted result so a backend shape drift fails loudly here instead of
 * silently corrupting the session.
 */
export function adaptLoginResponse(raw: unknown): LoginResponse {
  const unwrapped = unwrapEnvelope<unknown>(raw);
  const parsed = rawLoginResponseSchema.parse(unwrapped);

  const adapted: LoginResponse = {
    accessToken: parsed.token,
    refreshToken: "",
    user: {
      id: String(parsed.id),
      fullName: parsed.fullName,
      email: parsed.email ?? null,
      phoneNumber: parsed.phoneNumber ?? "",
      role: decodeJwtRole(parsed.token),
      avatarUrl: null,
      isProfileComplete: true,
    },
  };

  return loginResponseSchema.parse(adapted);
}
