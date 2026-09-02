/**
 * @file orderAdapter.ts
 *
 * Single translation boundary between the raw live `/api/Orders` payload
 * (numeric ids, numeric enum codes) and the dealer order view-model.
 *
 * The numeric → code mapping is NOT re-implemented here: it reuses the admin
 * reverse-maps in `@modules/orders/lib/orderEnums` (single source of truth
 * for the enum tables). We then translate the admin status code-name to the
 * dealer-flavoured status name the screens bind to — that last hop is the
 * only dealer-local mapping and is a plain 5-entry record, not a parallel
 * enum table.
 *
 * Never throws — malformed rows / unknown codes degrade to safe defaults.
 */
import { orderStatusFromNumber } from "@modules/orders/lib/orderEnums";
import type { OrderStatus as AdminOrderStatus } from "@modules/orders/types";
import type { RawDealerOrder } from "../api/dealerApi";
import type { Order, OrderAddress, OrderDetail, OrderItem, OrderStatus } from "../types";

/**
 * TEMP: commission / net are NOT provided by GET /api/Orders. Computed
 * front-side until the backend exposes them.
 * TODO: wire to backend — commission not provided by GET /api/Orders.
 */
const COMMISSION_RATE = 0.05;

/** Admin status code-name → dealer status name (screens bind to the dealer name). */
const ADMIN_TO_DEALER_STATUS: Record<AdminOrderStatus, OrderStatus> = {
  InWaiting: "new",
  Ready: "preparing",
  Shipped: "shipped",
  Received: "delivered",
  Canceled: "cancelled",
};

const num = (v: number | null | undefined): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const str = (v: string | null | undefined): string => v ?? "";

function toDealerStatus(code: number): OrderStatus {
  const adminName = orderStatusFromNumber(code);
  return adminName ? ADMIN_TO_DEALER_STATUS[adminName] : "new";
}

/** `trackNumber` when present & non-empty, else `#${id}`. */
function orderCode(raw: RawDealerOrder): string {
  const track = str(raw?.trackNumber).trim();
  return track || `#${raw?.id ?? ""}`;
}

function adaptItems(raw: RawDealerOrder): OrderItem[] {
  return (raw?.orderItems ?? []).map((item) => ({
    id: String(item?.id ?? ""),
    serviceName: str(item?.serviceName),
    providerName: str(item?.providerName),
    unitPrice: num(item?.unitPrice),
    quantity: num(item?.quantity),
    lineSubtotal: num(item?.subtotal),
  }));
}

function adaptAddress(raw: RawDealerOrder): OrderAddress | null {
  const title = str(raw?.addressTitle);
  const description = str(raw?.addressDescription);
  const shortNumber = str(raw?.addressShortNumber);
  if (!title && !description && !shortNumber) return null;
  return {
    title,
    description,
    shortNumber,
    latitude: typeof raw?.addressLatitude === "number" ? raw.addressLatitude : null,
    longitude: typeof raw?.addressLongitude === "number" ? raw.addressLongitude : null,
  };
}

/** Flat list-row mapping (GET /api/Orders → data.items[]). */
export function adaptRawOrder(raw: RawDealerOrder): Order {
  return {
    id: String(raw?.id ?? ""),
    code: orderCode(raw),
    customerName: str(raw?.userFullName),
    status: toDealerStatus(raw?.status),
    // `totalItems` is 0 on every list row — count the items array instead.
    itemCount: (raw?.orderItems ?? []).length,
    subtotal: num(raw?.subtotal),
    discountAmount: num(raw?.discountAmount),
    totalPrice: num(raw?.totalPrice),
    createdAt: str(raw?.createdAt),
  };
}

/** Richer mapping for GET /api/Orders/{id}: items, address, temp commission. */
export function adaptRawOrderDetail(raw: RawDealerOrder): OrderDetail {
  const base = adaptRawOrder(raw);
  const commissionAmount = base.totalPrice * COMMISSION_RATE;
  return {
    ...base,
    items: adaptItems(raw),
    address: adaptAddress(raw),
    commissionRate: COMMISSION_RATE * 100,
    commissionAmount,
    netAmount: base.totalPrice - commissionAmount,
  };
}
