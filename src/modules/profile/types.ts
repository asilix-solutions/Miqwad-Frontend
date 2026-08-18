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
  /** ASCII "FromDay-ToDay" range, e.g. "Sat-Thu". See workingHours.ts. */
  workingDays: string | null;
  /** ASCII "HH:mm-HH:mm" range, e.g. "09:00-18:00". See workingHours.ts. */
  workingHours: string | null;
}

/** PUT /api/profile body. */
export interface UpdateAccountProfileRequest {
  fullName: string;
  phoneNumber: string;
  address: string;
  identityNumber: string;
  city: string;
}

/**
 * PUT /api/profile/working-days body — WorkshopOwner-only today (scrap's
 * SalvageSpecialist role gets a 400). Both fields are ALWAYS required
 * together: omitting one nulls it out rather than merging.
 */
export interface UpdateWorkingDaysRequest {
  workingDays: string;
  workingHours: string;
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

/**
 * The signed-in user's own profile image, from GET/POST/PUT /api/profile/image.
 * `url` is absolute. A `null` query result means no image exists (confirmed
 * live: GET 404s when unset — the api layer degrades that to `null`).
 */
export interface ProfileImage {
  url: string;
}
