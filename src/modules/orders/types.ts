/**
 * @file types.ts
 * @description Frontend Order model for the admin Orders module, backed by
 * the real /api/Orders backend. The API speaks numeric enum codes in both
 * directions; the adapter (lib/orderAdapter.ts) converts them to/from the
 * string code-names used here (type/status/paymentMethod/paymentStatus) via
 * orderEnums.ts.
 *
 * `Order` is the flat list-row shape. `OrderDetail` extends it with the
 * richer fields GET /api/Orders/{id} surfaces (amounts, address, payment
 * status, line items, salvage vehicle block, attachments) — live-probed
 * 2026-09-01: the detail endpoint returns the same polymorphic object as a
 * list row, shaped by orderType (SpareParts carries orderItems, Salvage
 * carries the brand/piece block + attachments, others carry neither).
 */
import type { PaginatedResponse } from "@shared/types/api";

export type OrderStatus = "InWaiting" | "Ready" | "Shipped" | "Received" | "Canceled";
export type OrderType = "SpareParts" | "Salvage" | "TowTruck" | "Insurance" | "Mojaz";
export type PaymentMethod = "Cash" | "CreditCard" | "DebitCard" | "BankTransfer";
export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export interface Order {
  id: string;
  userId: string;
  userFullName: string;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  trackNumber: string;
  createdAt: string;
}

/** One purchased line on a SpareParts order (GET /{id} → orderItems[]). */
export interface OrderLineItem {
  id: string;
  serviceName: string;
  providerName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

/** Delivery address block — present on SpareParts orders, null otherwise. */
export interface OrderAddress {
  title: string;
  description: string;
  shortNumber: string;
  latitude: number | null;
  longitude: number | null;
}

/** Salvage-request vehicle block (GET /{id} on a Salvage order). */
export interface OrderVehicle {
  brandName: string;
  brandModel: string;
  brandYear: string;
  piecesName: string;
  serialNumber: string;
}

/** Customer-uploaded file attached to an order. */
export interface OrderAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
}

export interface OrderDetail extends Order {
  /** "" when the order has no payment leg (e.g. Salvage) or an unknown/0 code. */
  paymentStatus: PaymentStatus | "";
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  address: OrderAddress | null;
  items: OrderLineItem[];
  vehicle: OrderVehicle | null;
  attachments: OrderAttachment[];
}

export interface UpdateOrderInput {
  type: OrderType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  trackNumber: string;
}

export type OrdersPage = PaginatedResponse<Order>;
