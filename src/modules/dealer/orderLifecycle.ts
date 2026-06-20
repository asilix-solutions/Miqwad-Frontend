/**
 * Dealer order lifecycle: valid status transitions and helpers.
 * Single source of truth for which transitions are allowed.
 * Used by both the mock server and (via nextStatuses) the UI in Phase 4B.
 */
import type { OrderStatus } from "./types";

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  new:       ["preparing", "cancelled"],
  preparing: ["shipped",   "cancelled"],
  shipped:   ["delivered"],
  delivered: [],
  cancelled: [],
};

/** Returns true if the transition from → to is a valid order status move. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (TRANSITIONS[from] as readonly string[]).includes(to);
}

/** Returns all valid next statuses reachable from `from`. Empty array means terminal. */
export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] as OrderStatus[];
}
