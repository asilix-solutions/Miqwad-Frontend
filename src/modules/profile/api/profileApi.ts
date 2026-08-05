/**
 * @file profileApi.ts
 *
 * Thin API layer for the generic /api/profile surface, which operates on
 * the CURRENT token holder — so it serves every role's own account (admin,
 * dealer, workshop, scrap). `/api/profile` has no role-specific prefix, so
 * it bypasses the always-mocked bridge (see shared/mocks/server.ts) and
 * hits the real .NET backend.
 */

import { apiClient } from "@shared/lib/axios";
import { unwrapEnvelope } from "@modules/auth/api/auth.adapter";
import type {
  AccountProfile,
  UpdateAccountProfileRequest,
  ResetAccountPasswordRequest,
  ChangeAccountPhoneRequest,
  ChangeAccountPhoneVerifyRequest,
} from "../types";

/** Raw GET /api/profile record — shape unverified in swagger, tolerate anything. */
interface RawAccountProfile {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  identityNumber?: string | null;
  idenityNumber?: string | null;
  [key: string]: unknown;
}

/**
 * GET /api/profile response shape is unverified in swagger — fields are
 * best-effort; confirm against a live authenticated response and tighten
 * later. Tolerates an enveloped or flat payload, and either spelling of the
 * identity-number field (the backend uses both spellings across endpoints).
 */
function adaptProfile(raw: unknown): AccountProfile {
  const data = unwrapEnvelope<RawAccountProfile>(raw) ?? {};
  return {
    fullName: data.fullName ?? null,
    email: data.email ?? null,
    phoneNumber: data.phoneNumber ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    identityNumber: data.identityNumber ?? data.idenityNumber ?? null,
  };
}

export const profileApi = {
  getProfile: async (): Promise<AccountProfile> => {
    const { data } = await apiClient.get("/profile");
    return adaptProfile(data);
  },

  updateProfile: async (payload: UpdateAccountProfileRequest): Promise<AccountProfile> => {
    const { data } = await apiClient.put("/profile", payload);
    return adaptProfile(data);
  },

  resetPassword: async (payload: ResetAccountPasswordRequest): Promise<void> => {
    await apiClient.post("/profile/reset-password", payload);
  },

  changePhoneRequest: async (payload: ChangeAccountPhoneRequest): Promise<void> => {
    await apiClient.post("/profile/change-phone-number", payload);
  },

  changePhoneVerify: async (payload: ChangeAccountPhoneVerifyRequest): Promise<void> => {
    await apiClient.post("/profile/change-phone-number/verify", payload);
  },
};
