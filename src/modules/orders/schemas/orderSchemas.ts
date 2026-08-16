/**
 * @file orderSchemas.ts
 * @description Zod validation for the order update form. Error messages are
 * i18n keys (translated at render time via `t()`), not literal strings, so
 * both ar/en are covered from a single schema.
 */
import { z } from "zod";
import type { OrderStatus, OrderType, PaymentMethod } from "../types";
import { ORDER_STATUS_OPTIONS, ORDER_TYPE_OPTIONS, PAYMENT_METHOD_OPTIONS } from "../lib/orderEnums";

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUS_OPTIONS as [OrderStatus, ...OrderStatus[]], {
    message: "orders.validation.statusRequired",
  }),
  type: z.enum(ORDER_TYPE_OPTIONS as [OrderType, ...OrderType[]], {
    message: "orders.validation.typeRequired",
  }),
  paymentMethod: z.enum(PAYMENT_METHOD_OPTIONS as [PaymentMethod, ...PaymentMethod[]], {
    message: "orders.validation.paymentMethodRequired",
  }),
  trackNumber: z.string().optional(),
});

export type OrderUpdateFormValues = z.infer<typeof orderUpdateSchema>;
