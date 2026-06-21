/**
 * @file shipmentLifecycle.ts
 *
 * Dealer shipment lifecycle: valid status transitions and helpers.
 * Single source of truth for which transitions are allowed.
 * Used by both the mock server and (via nextShipmentStatuses) the UI.
 */
import type { ShipmentStatus } from "./types";

const TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  pending:    ["in_transit", "returned"],
  in_transit: ["delivered",  "returned"],
  delivered:  [],
  returned:   [],
};

/** Returns true if the transition from → to is a valid shipment status move. */
export function canTransitionShipment(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return (TRANSITIONS[from] as readonly string[]).includes(to);
}

/** Returns all valid next statuses reachable from `from`. Empty array means terminal. */
export function nextShipmentStatuses(from: ShipmentStatus): ShipmentStatus[] {
  return TRANSITIONS[from] as ShipmentStatus[];
}
