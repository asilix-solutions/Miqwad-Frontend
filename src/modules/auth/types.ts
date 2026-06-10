/**
 * Auth domain types — mirror what the backend will return
 * once the .NET implementation matches the MVP spec.
 */

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

export interface UpdateProfileRequest {
  fullName: string;
  email?: string;
  role: UserRole;
}
