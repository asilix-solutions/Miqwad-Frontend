/**
 * Dealer module types.
 * 
 * Represents the contract between the frontend and the future .NET backend.
 */

/** 
 * Dealer sells NEW parts only. 
 * FUTURE: "refurbished" might be added.
 */
export type ProductCondition = "new";

export type ProductStatus = "active" | "draft" | "out_of_stock" | "archived";

export interface Product {
  id: string;
  dealerId: string; // owning dealer (provider id)
  nameAr: string; 
  nameEn: string;
  sku: string;
  categoryId: string;
  price: number; // SAR
  condition: ProductCondition;
  status: ProductStatus;
  stockQty: number; // denormalized current stock (source of truth = Inventory)
  images?: string[];
  descriptionAr?: string; 
  descriptionEn?: string;
  // FUTURE: compatibleVehicles?: string[] // FR-MKT-03 wallet/vehicle compatibility filter
  createdAt: string; 
  updatedAt: string;
}

export interface Inventory {
  productId: string;
  dealerId: string;
  onHand: number;
  reserved: number; // reserved by open orders
  // FUTURE: reorderThreshold?: number;
  updatedAt: string;
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
