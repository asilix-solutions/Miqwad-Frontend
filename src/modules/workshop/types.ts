/**
 * @file types.ts
 *
 * Workshop-specific domain types.
 * Core provider types (ProviderProfile, ProviderType, etc.) live in
 * @modules/providers/types and are reused directly — only workshop-
 * domain additions belong here.
 */

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface WorkshopStats {
  rating: number;
  activeServicesCount: number;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface WorkshopProfile {
  workshopId: number;
  companyName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string | null;
  workingHours: string | null;
  specialization: string | null;
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  updatedAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export type WorkshopSubscriptionStatus = "active" | "pending" | "expired" | "cancelled";

export type WorkshopBillingCycle = "monthly" | "yearly";

export interface WorkshopSubscriptionPrivileges {
  topListing: boolean;
  freeInspectionOffers: boolean;
}

export interface WorkshopSubscription {
  id: string;
  workshopId: number;
  planName: string;
  price: number;
  billingCycle: WorkshopBillingCycle;
  status: WorkshopSubscriptionStatus;
  startDate: string;
  endDate: string;
  privileges: WorkshopSubscriptionPrivileges;
  renewedAt?: string;
}
