import { apiClient } from "@shared/lib/axios";
import { adaptLoginResponse, unwrapEnvelope, unwrapEnvelopeMessage } from "./auth.adapter";
import { PROVIDER_TYPE_TO_ROLE } from "../register/providerRole";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterProviderPayload,
  RegisterProviderResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UpdateProfileRequest,
  User,
  VerifyEmailOtpRequest,
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

  // REAL CONTRACT (confirmed live): POST /auth/register — single .NET swap
  // point for per-type provider registration (see src/modules/auth/register/).
  // Backend rejects role 1 (Admin) and 6 (Customer); PROVIDER_TYPE_TO_ROLE
  // only ever produces 2/3/4. Response is enveloped and carries NO token —
  // the account must verify its email before it can log in.
  registerProvider: async (payload: RegisterProviderPayload): Promise<RegisterProviderResponse> => {
    const { data } = await apiClient.post<unknown>("/auth/register", {
      fullName: payload.companyName,
      email: payload.email,
      phoneNumber: payload.phone,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      termsOfServiceAccepted: payload.termsOfServiceAccepted,
      role: PROVIDER_TYPE_TO_ROLE[payload.providerType],
    });
    const result = unwrapEnvelope<{ id: string | number; fullName: string; email: string; userRole: number }>(
      data,
    );
    return {
      id: String(result.id),
      fullName: result.fullName,
      email: result.email,
      userRole: result.userRole,
      message: unwrapEnvelopeMessage(data),
    };
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

  // REAL CONTRACT (confirmed live, enveloped {success,message}): verifies the
  // OTP emailed after provider registration. Wrong/expired otp → 400.
  // Already a passthrough on the mock server — do not add a mock handler.
  verifyEmailOtp: async (payload: VerifyEmailOtpRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<unknown>("/auth/verify-email-otp", payload);
    return { message: unwrapEnvelopeMessage(data) };
  },

  // REAL CONTRACT (confirmed live, enveloped {success,message,data,errors}):
  // always 200 — never reveals whether the email exists (security requirement).
  forgotPassword: async (payload: ForgotPasswordRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<unknown>("/auth/forgot-password", payload);
    return { message: unwrapEnvelopeMessage(data) };
  },

  // REAL CONTRACT (confirmed live): invalid/expired token → 400 with
  // message "Invalid or expired password reset token." (see auth.adapter.ts
  // isInvalidResetTokenError). Password mismatch is caught client-side.
  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> => {
    const { data } = await apiClient.post<unknown>("/auth/reset-password", payload);
    return { message: unwrapEnvelopeMessage(data) };
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
