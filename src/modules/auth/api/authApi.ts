import { apiClient } from "@shared/lib/axios";
import { adaptLoginResponse } from "./auth.adapter";
import type {
  LoginRequest,
  LoginResponse,
  RegisterProviderPayload,
  RegisterProviderResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  User,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from "../types";

/**
 * Thin transport layer for /auth + /users/me endpoints.
 * The MVP plan expects the Backend to expose:
 *   POST /auth/register, POST /auth/verify-otp,
 *   POST /auth/refresh-token, POST /auth/logout,
 *   GET  /users/me, PUT /users/me
 *
 * When the backend is not yet ready (Sprint 0 → 1 handoff),
 * these requests are intercepted by the mock layer (see
 * `@shared/mocks`) so the UI is fully exercisable.
 */

export const authApi = {
  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post<RegisterResponse>("/auth/register", payload);
    return data;
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const { data } = await apiClient.post<VerifyOtpResponse>("/auth/verify-otp", payload);
    return data;
  },

  // Provider signup engine (email/password, no OTP). Single .NET swap point
  // for per-type provider registration — see src/modules/auth/register/.
  registerProvider: async (payload: RegisterProviderPayload): Promise<RegisterProviderResponse> => {
    const { data } = await apiClient.post<RegisterProviderResponse>(
      "/auth/register-provider",
      payload,
    );
    return data;
  },

  // REAL CONTRACT (confirmed live): POST /auth/login expects { email, password }
  // and returns a flat (non-enveloped) body with a single `token` — no
  // refreshToken. `LoginRequest.identifier` stays as the UI-facing field name
  // (the email/password form); this is the single place that maps it onto
  // the backend's `email` field and adapts the flat response back into the
  // frontend's `LoginResponse` shape. See auth.adapter.ts.
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<unknown>("/auth/login", {
      email: payload.identifier,
      password: payload.password,
    });
    return adaptLoginResponse(data);
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>("/users/me");
    return data;
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<User> => {
    const { data } = await apiClient.put<User>("/users/me", payload);
    return data;
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<User>("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
