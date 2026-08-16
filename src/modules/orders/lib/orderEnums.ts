/**
 * @file orderEnums.ts
 * @description Const maps for the three order enums (status/type/paymentMethod)
 * confirmed from live Swagger x-enumNames — all start at 1. READ responses
 * from /api/Orders return the code-name as a string (e.g. "InWaiting");
 * WRITE (PUT) requires the numeric code. These maps + helpers are the single
 * source of truth for that translation and for i18n label lookup.
 */
import type { OrderStatus, OrderType, PaymentMethod } from "../types";

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

export const orderStatusToNumber = (status: OrderStatus): number =>
  nameToNumber(ORDER_STATUS_MAP, status);
export const orderTypeToNumber = (type: OrderType): number =>
  nameToNumber(ORDER_TYPE_MAP, type);
export const paymentMethodToNumber = (method: PaymentMethod): number =>
  nameToNumber(PAYMENT_METHOD_MAP, method);

export const orderStatusToI18nKey = (status: OrderStatus | string): string =>
  nameToI18nKey(ORDER_STATUS_MAP, status);
export const orderTypeToI18nKey = (type: OrderType | string): string =>
  nameToI18nKey(ORDER_TYPE_MAP, type);
export const paymentMethodToI18nKey = (method: PaymentMethod | string): string =>
  nameToI18nKey(PAYMENT_METHOD_MAP, method);

export const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_MAP) as OrderStatus[];
export const ORDER_TYPE_OPTIONS = Object.keys(ORDER_TYPE_MAP) as OrderType[];
export const PAYMENT_METHOD_OPTIONS = Object.keys(PAYMENT_METHOD_MAP) as PaymentMethod[];
