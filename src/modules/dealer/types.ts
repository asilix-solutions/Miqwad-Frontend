/**
 * Dealer module types.
 *
 * Represents the contract between the frontend and the future .NET backend.
 */

/**
 * A dealer "product" is a thin wrapper around an admin catalog service —
 * `GET/POST/PUT/DELETE /api/provider-services`. Picking a service, then
 * setting price/quantity/notes, IS adding a product; there is no
 * free-standing name/sku/image/category on the dealer side. `serviceId` is
 * immutable after create (PUT only accepts quantity/price/notes).
 */
export interface Product {
  id: string;
  providerId: string; // owning dealer (provider id) — server-derived from the JWT, never sent on write
  serviceId: string; // FK into the admin service catalog (GET /api/Services)
  serviceName: string; // denormalised by the backend for display
  orderId: string | null; // set once a customer order references this offering
  quantity: number;
  price: number; // SAR
  notes?: string;
}

/** A category a catalog service belongs to (denormalised on the service itself). */
export interface ServiceCategoryRef {
  id: string;
  name: string;
}

/** One `GET /api/Services` entry, adapted for the dealer's service picker. */
export interface ServiceCatalogItem {
  id: string;
  name: string;
  parentServiceId: string | null;
  categories: ServiceCategoryRef[];
  isActive: boolean;
}

export type OrderStatus = "new" | "preparing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  nameAr: string; 
  nameEn: string; // snapshot at purchase time
  sku: string;
  unitPrice: number; // SAR snapshot
  qty: number;
  lineTotal: number; // unitPrice * qty (SAR)
}

export interface Order {
  id: string;
  dealerId: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number; // SAR sum of lineTotals
  commissionRate: number; // % snapshot taken from dealer at order time (read-only to dealer)
  commissionAmount: number; // SAR = subtotal * rate/100
  netToDealer: number; // SAR = subtotal - commissionAmount
  status: OrderStatus;
  shipmentId?: string;
  createdAt: string; 
  updatedAt: string;
}

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
