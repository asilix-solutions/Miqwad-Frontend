/**
 * @file orderEnums.ts
 * @description Const maps for the three order enums (status/type/paymentMethod)
 * confirmed from live Swagger — all start at 1. Both READ and WRITE on
 * /api/Orders speak the NUMERIC code (live-probed 2026-09-01: e.g.
 * `status: 1`, `orderType: 2`). These maps + helpers are the single source of
 * truth for translating a number → its internal string code-name (and i18n
 * key) and back to the numeric code. The reverse (number → name) helpers
 * below are derived from the same maps — no parallel table.
 */
import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "../types";

interface EnumEntry {
  number: number;
  i18nKey: string;
}

export const ORDER_STATUS_MAP: Record<OrderStatus, EnumEntry> = {
  InWaiting: { number: 1, i18nKey: "orders.status.InWaiting" },
  Ready: { number: 2, i18nKey: "orders.status.Ready" },
  Shipped: { number: 3, i18nKey: "orders.status.Shipped" },
  Received: { number: 4, i18nKey: "orders.status.Received" },
  Canceled: { number: 5, i18nKey: "orders.status.Canceled" },
};

export const ORDER_TYPE_MAP: Record<OrderType, EnumEntry> = {
  SpareParts: { number: 1, i18nKey: "orders.type.SpareParts" },
  Salvage: { number: 2, i18nKey: "orders.type.Salvage" },
  TowTruck: { number: 3, i18nKey: "orders.type.TowTruck" },
  Insurance: { number: 4, i18nKey: "orders.type.Insurance" },
  Mojaz: { number: 5, i18nKey: "orders.type.Mojaz" },
};

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, EnumEntry> = {
  Cash: { number: 1, i18nKey: "orders.paymentMethod.Cash" },
  CreditCard: { number: 2, i18nKey: "orders.paymentMethod.CreditCard" },
  DebitCard: { number: 3, i18nKey: "orders.paymentMethod.DebitCard" },
  BankTransfer: { number: 4, i18nKey: "orders.paymentMethod.BankTransfer" },
};

/**
 * PaymentStatus map. Swagger declares the enum as 1..4 with no name table;
 * only "Pending" is attested (in the endpoint example). Live probe
 * (2026-09-01) additionally returns `0` on legacy/seed orders and `null` on
 * orders with no payment leg (Salvage). We treat 0/null as "no status"
 * (numberToName → "" → row hidden) and map 1..4 to the canonical .NET
 * payment-status progression. If the backend's real names differ this is a
 * one-line i18n-key change at this single boundary — no parallel table.
 */
export const PAYMENT_STATUS_MAP: Record<PaymentStatus, EnumEntry> = {
  Pending: { number: 1, i18nKey: "orders.paymentStatus.Pending" },
  Paid: { number: 2, i18nKey: "orders.paymentStatus.Paid" },
  Failed: { number: 3, i18nKey: "orders.paymentStatus.Failed" },
  Refunded: { number: 4, i18nKey: "orders.paymentStatus.Refunded" },
};

function nameToNumber<TName extends string>(
  map: Record<TName, EnumEntry>,
  name: TName,
): number {
  return map[name].number;
}

function nameToI18nKey<TName extends string>(
  map: Record<TName, EnumEntry>,
  name: TName | string,
): string {
  const entry = map[name as TName];
  return entry ? entry.i18nKey : name;
}

/**
 * Reverse lookup: numeric enum code → internal string code-name, derived
 * from the same canonical map. Returns "" for null/undefined or an
 * unrecognised code so downstream i18n lookup falls back to a neutral label
 * rather than mislabeling the order.
 */
function numberToName<TName extends string>(
  map: Record<TName, EnumEntry>,
  code: number | null | undefined,
): TName | "" {
  if (code == null) return "";
  const hit = (Object.keys(map) as TName[]).find((name) => map[name].number === code);
  return hit ?? "";
}

export const orderStatusToNumber = (status: OrderStatus): number =>
  nameToNumber(ORDER_STATUS_MAP, status);
export const orderTypeToNumber = (type: OrderType): number =>
  nameToNumber(ORDER_TYPE_MAP, type);
export const paymentMethodToNumber = (method: PaymentMethod): number =>
  nameToNumber(PAYMENT_METHOD_MAP, method);

export const orderStatusFromNumber = (code: number | null | undefined): OrderStatus | "" =>
  numberToName(ORDER_STATUS_MAP, code);
export const orderTypeFromNumber = (code: number | null | undefined): OrderType | "" =>
  numberToName(ORDER_TYPE_MAP, code);
export const paymentMethodFromNumber = (code: number | null | undefined): PaymentMethod | "" =>
  numberToName(PAYMENT_METHOD_MAP, code);
export const paymentStatusFromNumber = (code: number | null | undefined): PaymentStatus | "" =>
  numberToName(PAYMENT_STATUS_MAP, code);

export const orderStatusToI18nKey = (status: OrderStatus | string): string =>
  nameToI18nKey(ORDER_STATUS_MAP, status);
export const orderTypeToI18nKey = (type: OrderType | string): string =>
  nameToI18nKey(ORDER_TYPE_MAP, type);
export const paymentMethodToI18nKey = (method: PaymentMethod | string): string =>
  nameToI18nKey(PAYMENT_METHOD_MAP, method);
export const paymentStatusToI18nKey = (status: PaymentStatus | string): string =>
  nameToI18nKey(PAYMENT_STATUS_MAP, status);

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_MAP) as OrderStatus[];
export const ORDER_TYPE_OPTIONS = Object.keys(ORDER_TYPE_MAP) as OrderType[];
export const PAYMENT_METHOD_OPTIONS = Object.keys(PAYMENT_METHOD_MAP) as PaymentMethod[];
