/**
 * @file types.ts
 *
 * Shared, theme-free account/profile types for the generic /api/profile
 * surface, which operates on the CURRENT token holder — so the same shapes
 * serve admin, dealer, workshop, and scrap accounts alike.
 *
 * All fields are nullable: the live GET response shape is unverified in
 * swagger (only "200 OK" is documented), so every field is best-effort.
 */

/** The signed-in user's own account, from GET /api/profile. */
export interface AccountProfile {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  identityNumber: string | null;
}

/** PUT /api/profile body. */
export interface UpdateAccountProfileRequest {
  fullName: string;
  phoneNumber: string;
  address: string;
  identityNumber: string;
  city: string;
}

/** POST /api/profile/reset-password body. */
export interface ResetAccountPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

/** POST /api/profile/change-phone-number body — step 1, requests an OTP. */
export interface ChangeAccountPhoneRequest {
  oldPhoneNumber: string;
  newPhoneNumber: string;
}

/** POST /api/profile/change-phone-number/verify body — step 2, confirms the OTP. */
export interface ChangeAccountPhoneVerifyRequest {
  newPhoneNumber: string;
  code: string;
}
