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
