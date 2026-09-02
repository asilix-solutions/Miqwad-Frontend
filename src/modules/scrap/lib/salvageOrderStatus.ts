/**
 * @file salvageOrderStatus.ts
 *
 * Single translation boundary for the numeric salvage-order status code.
 * Reuses the shared `orderEnums` reverse-map (single source of truth for the
 * order-status table) — no parallel enum table here.
 *
 * TODO: confirm salvage status labels with backend — every live salvage order
 * is currently status 1 (InWaiting), so only that label is battle-tested.
 */
import {
  orderStatusFromNumber,
  orderStatusToI18nKey,
} from "@modules/orders/lib/orderEnums";

/**
 * Numeric order-status code → i18n key. Falls back to a neutral bilingual
 * label when the code is unknown / unmapped rather than mislabeling the order.
 */
export function salvageOrderStatusI18nKey(code: number | null | undefined): string {
  const name = orderStatusFromNumber(code);
  return name ? orderStatusToI18nKey(name) : "scrap.partRequests.statusUnknown";
}
