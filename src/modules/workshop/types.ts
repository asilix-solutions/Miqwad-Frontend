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

// ── Working hours ─────────────────────────────────────────────────────────────

export type DayOfWeek = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export interface DayHours {
  isClosed: boolean;
  /** "HH:mm" e.g. "09:00" */
  open?: string;
  /** "HH:mm" e.g. "21:00" */
  close?: string;
}

export type WeeklyHours = Record<DayOfWeek, DayHours>;

// ── Specializations ───────────────────────────────────────────────────────────

export type WorkshopServiceType =
  | "mechanical"
  | "bodywork"
  | "electrical"
  | "tires"
  | "periodicMaintenance";

/** No existing brand enum found in codebase — defined here for workshop use. */
export type WorkshopVehicleBrand =
  | "toyota"
  | "hyundai"
  | "mercedes"
  | "ford"
  | "chevrolet"
  | "nissan"
  | "bmw"
  | "other";

export interface WorkshopSpecializations {
  serviceTypes: WorkshopServiceType[];
  vehicleBrands: WorkshopVehicleBrand[];
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface WorkshopProfile {
  workshopId: number;
  companyName: string;
  email: string;

  // ── Legacy flat fields — kept for backward-compat; structured fields are canonical ──
  /** Kept for backward-compat; prefer contact.phone */
  phone: string;
  /** Kept for backward-compat; prefer location.address */
  address: string | null;
  /** Kept for backward-compat; prefer location.city */
  city: string | null;
  /** Human-readable display string used by the dashboard hero. */
  workingHoursLabel?: string | null;
  /** Human-readable display string used by the dashboard hero. */
  specializationLabel?: string | null;

  // ── Structured / enriched fields (new) ───────────────────────────────────
  bannerUrl?: string;
  /** Gallery image URLs; default [] */
  photos: string[];
  location?: { lat: number; lng: number; address: string; city: string };
  /** Structured weekly schedule — replaces the free-text workingHoursLabel for editing. */
  workingHours: WeeklyHours;
  /** Structured specializations — replaces the free-text specializationLabel for editing. */
  specializations: WorkshopSpecializations;
  contact: { phone: string; whatsapp?: string };

  // ── Meta ─────────────────────────────────────────────────────────────────
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
