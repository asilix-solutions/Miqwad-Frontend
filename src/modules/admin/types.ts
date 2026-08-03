/**
 * Admin domain types.
 *
 * The MVP plan calls for an admin review surface, but the current
 * Swagger does not yet expose admin endpoints. We model the shapes
 * here so the FE can ship today and switch to the real backend by
 * flipping VITE_USE_MOCKS off once the API team publishes them.
 *
 * Expected endpoints (mocked today, real later):
 *   GET    /admin/providers?status=pending|approved|rejected
 *   PATCH  /admin/providers/{id}/approve
 *   PATCH  /admin/providers/{id}/reject  body: { reason: string }
 */

import type { ProviderProfile } from "@modules/providers/types";

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
}

export type AdminProviderStatus = "pending" | "approved" | "rejected" | "all";

export type SubscriberType = "workshop" | "scrap";

/** Re-export so the admin module doesn't need a direct providers import. */
export type AdminProvider = ProviderProfile;

export interface RejectProviderRequest {
  reason: string;
}

/**
 * Real `GET /api/Users` / `GET /api/Users/{id}` shape (verbatim field
 * mapping — including the backend's `idenityNumber` misspelling). The wire
 * key is `roleId` (number); the adapter maps it onto `role` here for
 * `config/roleRegistry.ts` compatibility. Still optional — every consumer
 * must resolve display/grouping through the registry helpers, never compare
 * the raw number directly.
 */
export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string;
  address: string | null;
  city: string | null;
  idenityNumber: string | null;
  isActive: boolean;
  createdAt: string;
  role?: number;
}

export type AdminUserDetail = AdminUserRow;

/**
 * The admin's own account, from GET /api/profile — a generic endpoint that
 * operates on the current token holder (works for admin, provider, etc).
 * All fields are nullable: the live GET response shape is unverified in
 * swagger (only "200 OK" is documented), so every field is best-effort.
 */
export interface AdminProfile {
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  identityNumber: string | null;
}

/** PUT /api/profile body. */
export interface UpdateAdminProfileRequest {
  fullName: string;
  phoneNumber: string;
  address: string;
  identityNumber: string;
  city: string;
}

/** POST /api/profile/reset-password body. */
export interface ResetAdminPasswordRequest {
  newPassword: string;
  confirmPassword: string;
}

/** POST /api/profile/change-phone-number body — step 1, requests an OTP. */
export interface ChangeAdminPhoneRequest {
  oldPhoneNumber: string;
  newPhoneNumber: string;
}

/** POST /api/profile/change-phone-number/verify body — step 2, confirms the OTP. */
export interface ChangeAdminPhoneVerifyRequest {
  newPhoneNumber: string;
  code: string;
}

export interface MonthlyPoint { month: string; value: number; }
export interface StatusCount  { status: string; count: number; }

export type RevenueSource = "commission" | "subscription";

export interface RevenueRecord {
  id: string;
  source: RevenueSource;
  providerId: number;
  providerName: string;
  providerType: "dealer" | "workshop" | "scrap";
  amount: number;          // SAR, monthly
  detail?: string;         // e.g. "5% × 45000" for commission, plan name for sub
  periodMonth?: string;    // ISO month if relevant
}

export interface RevenueSummary {
  totalMonthly: number;
  commissionTotal: number;
  subscriptionTotal: number;
  records: RevenueRecord[];
}


export interface DashboardStats {
  totalUsers: number;
  activeProviders: number;
  pendingVerifications: number;

  monthlyRevenue: number;

  // Trend deltas vs previous month (percentage, can be negative)
  trends?: {
    totalUsers: number;
    activeProviders: number;
    pendingVerifications: number;

    monthlyRevenue: number;
  };

  // Time series — last 12 months, oldest first
  revenueSeries?: MonthlyPoint[];
  usersSeries?: MonthlyPoint[];

  // Distributions for pie/bar charts
  providerStatusBreakdown?: StatusCount[];

}
