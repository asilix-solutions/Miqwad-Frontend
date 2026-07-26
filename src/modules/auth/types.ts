/**
 * Auth domain types — mirror what the backend will return
 * once the .NET implementation matches the MVP spec.
 */

import type { ProviderType } from "@modules/providers/types";

export type UserRole = "customer" | "provider" | "driver" | "admin" | "super_admin";

/**
 * Provider KYC state stored on the user object so the router
 * can quickly decide whether to send a provider to the pending
 * page versus the full provider dashboard.
 */
export type ProviderStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isProfileComplete: boolean;
  /** Populated only when role === "provider". */
  providerId?: number | null;
  providerStatus?: ProviderStatus | null;
  /** Provider sub-type, populated only when role === "provider". */
  providerType?: ProviderType | null;
  /** Optional rejection reason set by an admin. */
  providerRejectionReason?: string | null;
  /**
   * Granular permission codes for role-based access control.
   *
   * Optional so that existing User objects (e.g. deserialized from
   * localStorage before this field existed) degrade gracefully —
   * `undefined` is treated as "no permissions" by `hasPermission()`.
   * The auth boundary (login/verify-otp) should always populate this
   * field; downstream code must never assume it is present.
   */
  permissions?: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterRequest {
  phoneNumber: string; // E.164 without leading + (e.g. 9665XXXXXXXX)
}

export interface RegisterResponse {
  /** Server-issued correlation id used to verify the OTP later. */
  verificationId: string;
  /** Seconds until a new OTP can be requested. */
  resendAfter: number;
}

export interface VerifyOtpRequest {
  verificationId: string;
  code: string;
}

export interface VerifyOtpResponse extends AuthTokens {
  user: User;
}

/**
 * PROVISIONAL CONTRACT — pending backend OQ1 (BACKEND_API_REQUIREMENTS.md:1049).
 * Response shape mirrors VerifyOtpResponse so session wiring is reused.
 * Confirm with backend before .NET wiring.
 */
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface UpdateProfileRequest {
  fullName: string;
  email?: string;
  role: UserRole;
}

/**
 * Payload for the per-type provider signup engine. `providerType` is
 * captured from the /register/{type} route and mapped to the backend's
 * numeric role in the api layer (see `register/providerRole.ts`).
 */
export interface RegisterProviderPayload {
  providerType: ProviderType;
  companyName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsOfServiceAccepted: boolean;
}

/**
 * REAL CONTRACT (confirmed live): POST /api/auth/register returns NO
 * token — the account still needs email verification before it can log
 * in. `message` is the backend's enveloped top-level message (e.g.
 * "...verify your email").
 */
export interface RegisterProviderResponse {
  id: string;
  fullName: string;
  email: string;
  userRole: number;
  message: string;
}

/** Session-less mutation — verifies the OTP emailed after provider registration. */
export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

/** Session-less mutation — sends a reset link if the email exists. */
export interface ForgotPasswordRequest {
  email: string;
}

/** Session-less mutation — sets a new password from an emailed token. */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Shared shape for the enveloped `{ success, message }` mutations above. */
export interface MessageResponse {
  message: string;
}
