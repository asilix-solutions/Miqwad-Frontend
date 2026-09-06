/**
 * @file types.ts
 *
 * Dealer module types.
 *
 * Orders are now backed by the LIVE `/api/Orders` backend (Phase B). The raw
 * contract (numeric ids, numeric enum codes, envelope) lives in
 * `api/dealerApi.ts` as `RawDealerOrder`; `lib/orderAdapter.ts` is the single
 * translation boundary that maps a raw order into the internal view-model
 * below. The internal model keeps the dealer-flavoured field names / status
 * codes the screens already bind to — the mapping happens at the edge.
 *
 * Shipments + dues are still served by the always-mocked `/dealer/*` bridge
 * (no live endpoints yet) and keep their original shapes.
 */
import type { ProviderService, ServiceCategoryRef, ServiceCatalogItem } from "@shared/provider-services";

export type { ServiceCategoryRef, ServiceCatalogItem };

/**
 * A dealer "product" is a thin wrapper around an admin catalog service —
 * `GET/POST/PUT/DELETE /api/provider-services`. Picking a service, then
 * setting price/quantity/notes, IS adding a product; there is no
 * free-standing name/sku/image/category on the dealer side. `serviceId` is
 * immutable after create (PUT only accepts quantity/price/notes). This is a
 * dealer-scoped alias of the shared `ProviderService` shape.
 */
export type Product = ProviderService;

// ── Orders (LIVE /api/Orders) ────────────────────────────────────────────────

/**
 * Dealer-flavoured order status. The live API speaks a NUMERIC enum
 * (`InWaiting=1 … Canceled=5`); the adapter reuses the admin reverse-maps in
 * `@modules/orders/lib/orderEnums` for number → code, then maps that code to
 * the dealer names below (which drive the pill wording seen in the screens).
 */
export type OrderStatus = "new" | "preparing" | "shipped" | "delivered" | "cancelled";

/** One purchased line (from `orderItems[]` on the list row and the detail). */
export interface OrderItem {
  id: string;
  serviceName: string;
  providerName: string;
  unitPrice: number; // SAR
  quantity: number;
  /** Line subtotal in SAR — the raw `subtotal` field on the item. */
  lineSubtotal: number;
}

/** Delivery address block — null when the order carries no address at all. */
export interface OrderAddress {
  title: string;
  description: string;
  shortNumber: string;
  latitude: number | null;
  longitude: number | null;
}

/** Flat list-row shape (GET /api/Orders → data.items[]). */
export interface Order {
  id: string;
  /** `trackNumber` when present & non-empty, else `#${id}`. */
  code: string;
  /** `userFullName` — "" when the API returns null. */
  customerName: string;
  status: OrderStatus;
  /** `orderItems.length` — the list row's `totalItems` is always 0, unusable. */
  itemCount: number;
  subtotal: number; // SAR
  discountAmount: number; // SAR
  totalPrice: number; // SAR
  /** Raw ISO string with NO timezone suffix — parse as LOCAL time. */
  createdAt: string;
}

/**
 * Detail shape (GET /api/Orders/{id}). Adds line items + address + a
 * TEMPORARY front-computed commission/net (the API provides neither — see
 * `lib/orderAdapter.ts`). Every optional block is null / [] when absent so
 * the detail view can drop its section cleanly.
 */
export interface OrderDetail extends Order {
  items: OrderItem[];
  address: OrderAddress | null;
  /** TEMP — front-computed. `COMMISSION_RATE * 100` as a percentage. */
  commissionRate: number;
  /** TEMP — front-computed: `totalPrice * COMMISSION_RATE`. */
  commissionAmount: number;
  /** TEMP — front-computed: `totalPrice - commissionAmount`. */
  netAmount: number;
}

/**
 * Typed params for the live orders list query. `orderType` is the numeric
 * OrderType enum and is sent server-side as `OrderType` (validated live: 400
 * for bad values). "all" in the UI omits it entirely.
 */
export interface DealerOrdersListParams {
  pageNumber?: number;
  pageSize?: number;
  orderType?: number;
}

// ── Offers (LIVE /api/Offers — token-scoped to the logged-in dealer) ─────────

/**
 * A dealer "offer" is a titled, date-windowed bundle of 1..N fixed-SAR
 * discount lines. There is NO percentage, store-wide, or category discount —
 * do not add any. Backed by the token-scoped `GET /api/Offers` (list) and
 * `GET /api/Offers/{id}` (detail); the two responses share this shape.
 *
 * `providerId` / `providerName` are returned by the API but the dealer UI
 * never needs them (the server infers the owner from the JWT) — kept here
 * only to mirror the wire contract. All date fields arrive with NO timezone
 * suffix and are normalised to UTC ISO strings in `api/offersApi.ts`.
 *
 * Written to be promotable to `src/shared/provider-ui` later (workshop /
 * scrap will reuse it) — no dealer-only assumptions leak into this shape.
 */
export interface Offer {
  /** Coerced from the API's int64 to a string per project convention. */
  id: string;
  title: string | null;
  /** UTC ISO string (normalised in the api layer). */
  startDate: string;
  /** UTC ISO string (normalised in the api layer). */
  endDate: string;
  /** Returned by the API; unused by the dealer UI. */
  providerId: string;
  providerName: string | null;
  /**
   * Stored flag — exact semantics (date-derived vs. an independent on/off
   * switch) are UNCONFIRMED and settled by the Stage-2 write-probe. Consume
   * only through `computeOfferStatus` in `offerStatus.ts`.
   */
  isActive: boolean;
  /** UTC ISO string (normalised in the api layer). */
  createdAt: string;
  /** UTC ISO string or null (normalised in the api layer). */
  updatedAt: string | null;
  items: OfferItem[];
}

/**
 * One fixed-SAR discount line on an {@link Offer}. `originalPrice` and
 * `discountedPrice` are SERVER-COMPUTED (display only); `discountAmount` is
 * the only value the dealer will edit — later, in Stage 3.
 */
export interface OfferItem {
  id: string;
  /** FK → a `GET /api/provider-services` row (the dealer portal's "Product"). */
  providerServiceId: string;
  serviceName: string | null;
  /** SAR — server-computed, display only. */
  originalPrice: number;
  /** SAR — fixed amount off; the only editable line value (Stage 3). */
  discountAmount: number;
  /** SAR — server-computed, display only. */
  discountedPrice: number;
}

/**
 * One discount line on the offer WRITE DTO. `providerServiceId` is a numeric
 * FK into `GET /api/provider-services`; `discountAmount` is a true decimal and
 * must be `> 0` (backend 400s otherwise).
 */
export interface OfferLineInput {
  providerServiceId: number;
  discountAmount: number;
}

/**
 * The single request DTO shared by CREATE (`POST /api/Offers`) and UPDATE
 * (`PUT /api/Offers/{id}`) — confirmed by the Stage-2 write-probe.
 *
 *   - `providerId` is OMITTED — the server infers the owner from the JWT.
 *   - `originalPrice` / `discountedPrice` / `isActive` are OMITTED —
 *     server-computed.
 *   - Dates are sent BARE-LOCAL (no `Z`, no offset), e.g.
 *     `"2026-09-05T00:00:00"` — the api layer's `toBareLocal` does this.
 *   - PUT is a FULL REPLACE of `items` — always send the complete array.
 */
export interface OfferWritePayload {
  title: string;
  /** `YYYY-MM-DD` from the form; normalised to bare-local in the api layer. */
  startDate: string;
  /** `YYYY-MM-DD` from the form; normalised to bare-local in the api layer. */
  endDate: string;
  items: OfferLineInput[];
}

/** Display status derived from an {@link Offer} — see `offerStatus.ts`. */
export type OfferStatus = "scheduled" | "active" | "expired" | "inactive";

/** Typed params for the token-scoped offers list query. */
export interface DealerOffersListParams {
  pageNumber?: number;
  pageSize?: number;
}

// ── Shipments + dues (mock /dealer/* bridge — unchanged) ─────────────────────

export type ShipmentStatus = "pending" | "in_transit" | "delivered" | "returned";

export interface Shipment {
  id: string;
  orderId: string;
  dealerId: string;
  carrier?: string;
  trackingNumber?: string;
  status: ShipmentStatus;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Typed params for the (still-mocked) shipments list query. */
export interface DealerShipmentsListParams {
  status?: string;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Financial summary.
 * Note: commissionRate is OWNED by admin (admin sets via existing
 * PATCH /admin/providers/:id/commission). Dealer side is READ-ONLY.
 */
export interface DealerDues {
  dealerId: string;
  commissionRate: number; // current % set by ADMIN (dealer cannot edit)
  grossSales: number; // SAR total of delivered orders
  totalCommission: number; // SAR owed to platform
  netEarnings: number; // SAR = gross - commission
  outstandingDebt: number; // SAR current dues balance
  debtAlert: boolean; // true if outstandingDebt > 500 (SRS FR-MKT-07)
  updatedAt: string;
}
