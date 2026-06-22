/**
 * @file types.ts
 *
 * Scrap-provider domain types (.NET-ready).
 * Core provider types live in @modules/providers/types and are reused directly.
 */

export type { PaginatedResponse } from "@shared/types/api";

// ── Vehicle brand ─────────────────────────────────────────────────────────────

/**
 * Vehicle brands for scrap specialization.
 * NOTE: WorkshopVehicleBrand in workshop/types.ts is identical — unify both
 * into a shared VehicleBrand type in @shared/types in a future cleanup pass.
 */
export type ScrapVehicleBrand =
  | "toyota"
  | "hyundai"
  | "mercedes"
  | "ford"
  | "chevrolet"
  | "nissan"
  | "bmw"
  | "gmc"
  | "kia"
  | "other";

// ── Profile ───────────────────────────────────────────────────────────────────

export interface ScrapProfile {
  scrapId: number;
  companyName: string;
  email: string;
  bannerUrl?: string;
  photos: string[];
  specializations: {
    vehicleBrands: ScrapVehicleBrand[];
  };
  location?: { lat: number; lng: number; address: string; city: string };
  contact: { phone: string; whatsapp?: string };
  rating: number;
  totalRatings: number;
  isVerified: boolean;
  workingHoursLabel?: string | null;
  updatedAt: string;
}

// ── Subscription ──────────────────────────────────────────────────────────────

export type ScrapSubscriptionStatus = "active" | "pending" | "expired" | "cancelled";

export type ScrapBillingCycle = "monthly" | "yearly";

export interface ScrapSubscriptionPrivileges {
  priorityListing: boolean;
  verifiedBadge: boolean;
}

export interface ScrapSubscription {
  id: string;
  scrapId: number;
  planName: string;
  price: number;
  billingCycle: ScrapBillingCycle;
  status: ScrapSubscriptionStatus;
  startDate: string;
  endDate: string;
  privileges: ScrapSubscriptionPrivileges;
  renewedAt?: string;
}

// ── Part Request ──────────────────────────────────────────────────────────────

export type PartRequestStatus =
  | "new"
  | "quoted"
  | "accepted"
  | "shipped"
  | "completed"
  | "cancelled";

export interface PartRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  /** Pre-masked by the backend, e.g. "05XXXXX004" */
  customerPhoneMasked: string;
  vehicle: {
    brand: ScrapVehicleBrand;
    model: string;
    year: number;
  };
  partName: string;
  description?: string;
  photos: string[];
  status: PartRequestStatus;
  createdAt: string;
  escrowId?: string;
}

// ── Escrow ────────────────────────────────────────────────────────────────────

export type EscrowStatus = "pending" | "held" | "released" | "disputed" | "refunded";

export interface Escrow {
  id: string;
  partRequestId: string;
  /** SAR amount */
  amount: number;
  status: EscrowStatus;
  heldAt?: string;
  releasedAt?: string;
  disputedAt?: string;
  refundedAt?: string;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface ScrapStats {
  openRequestsCount: number;
  /** SAR amount currently held in escrow */
  escrowHeldAmount: number;
  completedDealsCount: number;
}

// ── Offer payload ─────────────────────────────────────────────────────────────

export interface SubmitOfferPayload {
  price: number;
  note?: string;
  photos?: string[];
}
