/**
 * @file orderAdapter.ts
 * @description Single translation boundary between raw /api/Orders payloads
 * (numeric ids, string enum names) and the internal Order model. Never
 * throws — malformed raw items fall back to neutral values. Unknown enum
 * strings from the backend are passed through as-is so i18n lookup can fall
 * back to the raw string rather than silently mislabeling the order.
 */
import type { RawOrder, OrderWritePayload } from "../api/ordersApi";
import type { Order, OrderStatus, OrderType, PaymentMethod, UpdateOrderInput } from "../types";
import { orderStatusToNumber, orderTypeToNumber, paymentMethodToNumber } from "./orderEnums";

export function adaptRawOrder(raw: RawOrder): Order {
  return {
    id: String(raw?.id ?? ""),
    userId: String(raw?.userId ?? ""),
    userFullName: raw?.userFullName ?? "",
    type: (raw?.type ?? "") as OrderType,
    status: (raw?.status ?? "") as OrderStatus,
    paymentMethod: (raw?.paymentMethod ?? "") as PaymentMethod,
    trackNumber: raw?.trackNumber ?? "",
    createdAt: raw?.createdAt ?? "",
  };
}

export function adaptToUpdatePayload(input: UpdateOrderInput): OrderWritePayload {
  return {
    type: orderTypeToNumber(input.type),
    paymentMethod: paymentMethodToNumber(input.paymentMethod),
    status: orderStatusToNumber(input.status),
    trackNumber: input.trackNumber,
  };
}
