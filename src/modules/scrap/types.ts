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

// ── Salvage Orders (live Orders API, OrderType = 2) ────────────────────────────

/**
 * One attachment on a salvage order — live shape is `AttachmentResponseDto`
 * ({ filePath, originalFileName, contentType, ... }), NOT a bare string.
 * The raw shape is isolated in `salvageOrdersApi.ts`'s adapter.
 */
export interface SalvageOrderAttachment {
  id: string;
  originalFileName: string;
  filePath: string;
  contentType: string;
}

/**
 * View model adapted from the live `Order` DTO (OrderType = 2, salvage).
 * The raw backend shape is isolated in `salvageOrdersApi.ts`'s adapter — no
 * other file should assume anything about the raw `Order` fields.
 * Live-proven contract, PHASE B (feat/scrap-quotations-live).
 */
export interface SalvageOrder {
  id: string;
  partName: string;
  brand: string;
  model: string;
  year: string;
  serialNumber?: string;
  description?: string;
  attachments: SalvageOrderAttachment[];
  /** Convenience: `filePath`s pulled from `attachments`, for quick thumbnails. */
  photos: string[];
  customerName?: string;
  /**
   * Raw numeric order-status code. Translated at the UI boundary via the
   * shared `orderEnums` reverse-map (see `lib/salvageOrderStatus.ts`).
   */
  statusCode: number;
  /** ISO-8601, no TZ suffix → parsed as LOCAL time by the shared formatter. */
  createdAt: string;
}

// ── Request Quotations (live /api/request-quotations) ──────────────────────────

/**
 * Server binds Price (and Quantity) with a WHOLE-NUMBER model binder: any
 * decimal serialization — "0.01", "0,01", even "1.00" — fails to parse and
 * returns 400 ("The value '…' is not valid for Price."). Only bare integer
 * strings bind; the minimum accepted positive value is 1.
 * Per product decision these two fields are HIDDEN in the UI; POST/PUT always
 * send the placeholders below. 1 is a parseable positive placeholder, NOT a
 * real quoted price.
 * TODO: revisit if the backend switches Price to a decimal binder.
 */
export const QUOTATION_PLACEHOLDER_QUANTITY = 1;
export const QUOTATION_PLACEHOLDER_PRICE = 1;

/** One attachment on a request-quotation (live `attachments[]` item). */
export interface RequestQuotationAttachment {
  id: string;
  originalFileName: string;
  filePath: string;
  contentType: string;
}

/** A quotation the scrap provider has submitted, from GET /api/request-quotations. */
export interface RequestQuotation {
  id: string;
  orderId: string;
  name: string;
  quantity: number;
  price: number;
  notes: string | null;
  isCompatibleWith: string | null;
  attachments: RequestQuotationAttachment[];
  createdAt: string;
  updatedAt: string | null;
}

/** Fields the offer form collects — Quantity/Price are injected at submit, not here. */
export interface QuotationFormInput {
  name: string;
  notes?: string;
  isCompatibleWith?: string;
  files?: File[];
}

/** POST /api/request-quotations input (multipart). */
export interface CreateQuotationInput extends QuotationFormInput {
  orderId: string;
}

/** PUT /api/request-quotations/{id} input (multipart) — orderId is path-bound. */
export type UpdateQuotationInput = QuotationFormInput;
