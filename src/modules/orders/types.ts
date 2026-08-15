/**
 * @file types.ts
 * @description Frontend Order model for the admin Orders module, backed by
 * the real /api/Orders backend. READ fields (type/status/paymentMethod)
 * arrive as string code-names; writes go through orderEnums.ts to map back
 * to the numeric codes the PUT endpoint expects.
 */
import type { PaginatedResponse } from "@shared/types/api";

export type OrderStatus = "InWaiting" | "Ready" | "Shipped" | "Received" | "Canceled";
export type OrderType = "SpareParts" | "Salvage" | "TowTruck" | "Insurance" | "Mojaz";
export type PaymentMethod = "Cash" | "CreditCard" | "DebitCard" | "BankTransfer";

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

export interface UpdateOrderInput {
  type: OrderType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  trackNumber: string;
}

export type OrdersPage = PaginatedResponse<Order>;
