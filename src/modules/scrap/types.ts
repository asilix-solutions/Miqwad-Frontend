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
  /** Denormalized from the submitted offer for N+1-free reads. */
  offerPrice?: number;
  /** ISO-8601 timestamp when the scrap provider submitted the offer. */
  offeredAt?: string;
}

// ── My Offers (derived view) ──────────────────────────────────────────────────

/**
 * Semantic offer statuses from the scrap provider's perspective.
 * Collapsed from PartRequestStatus: quoted→pending, accepted+shipped→accepted,
 * completed→completed, cancelled→rejected.
 */
export type OfferStatus = "pending" | "accepted" | "completed" | "rejected";

/** Derived offer entity — mapped from a PartRequest where status !== "new". */
export interface MyOffer {
  partRequestId: string;
  requestNumber: string;
  customerName: string;
  vehicle: PartRequest["vehicle"];
  partName: string;
  offerPrice: number;
  offeredAt: string;
  status: OfferStatus;
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

// ── Salvage Orders (real Orders API, OrderType = salvage) ──────────────────────

/**
 * View model adapted from the real `Order` DTO (OrderType = salvage).
 * The raw backend shape is isolated in `salvageOrdersApi.ts`'s adapter — no
 * other file should assume anything about the raw `Order` fields.
 * See docs/probe-scrap-offers-2026-08-20.md §1.1/§1.4 for the source shape.
 */
export interface SalvageOrder {
  id: string;
  partName: string;
  brand: string;
  model: string;
  year: string;
  serialNumber?: string;
  description?: string;
  photos: string[];
  customerName?: string;
  /** Raw backend order status string — label mapping is unconfirmed, shown as-is. */
  status: string;
  createdAt: string;
}

// ── Offers (real /api/Offers) ───────────────────────────────────────────────

/**
 * Nested provider-service summary returned inside GET /api/Offers items.
 * Attachments are normalised to a plain `images` string array by the adapter.
 */
export interface OfferProviderService {
  id: string;
  serviceId: string;
  serviceName: string | null;
  quantity: number;
  price: number;
  notes: string | null;
  isCompatibleWith: string | null;
  images: string[];
}

/** A submitted offer, as returned by GET /api/Offers. */
export interface Offer {
  id: string;
  orderId: string;
  providerServiceId: string;
  startDate: string;
  endDate: string;
  providerService: OfferProviderService | null;
  createdAt: string;
}

/** POST /api/Offers body — confirmed against live Swagger 2026-08-23. */
export interface CreateOfferPayload {
  orderId: string;
  providerServiceId: string;
  /** ISO-8601 date-time string — converted at the API boundary. */
  startDate: string;
  /** ISO-8601 date-time string — converted at the API boundary. */
  endDate: string;
}

/** PUT /api/Offers/{id} body — orderId MUST NOT be included. */
export interface UpdateOfferPayload {
  providerServiceId: string;
  /** ISO-8601 date-time string — converted at the API boundary. */
  startDate: string;
  /** ISO-8601 date-time string — converted at the API boundary. */
  endDate: string;
}
