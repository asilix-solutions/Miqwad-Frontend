/**
 * @file partRequestLifecycle.ts
 *
 * Part-request state machine: valid transitions and UI tone helpers.
 * Single source of truth — used by mock server and UI alike.
 */

import type { PartRequestStatus } from "../types";
import type { ToneVariant } from "./escrowLifecycle";

const TRANSITIONS: Record<PartRequestStatus, readonly PartRequestStatus[]> = {
  new:       ["quoted",    "cancelled"],
  quoted:    ["accepted",  "cancelled"],
  accepted:  ["shipped",   "cancelled"],
  shipped:   ["completed"],
  completed: [],
  cancelled: [],
};

/** Returns true if the part-request transition from → to is valid. */
export function canPartRequestTransition(
  from: PartRequestStatus,
  to: PartRequestStatus,
): boolean {
  return (TRANSITIONS[from] as readonly string[]).includes(to);
}

/** Returns all valid next statuses reachable from `from`. */
export function nextPartRequestStatuses(from: PartRequestStatus): PartRequestStatus[] {
  return TRANSITIONS[from] as PartRequestStatus[];
}

/** Maps a part-request status to a UI colour tone. */
export function partRequestStatusTone(status: PartRequestStatus): ToneVariant {
  const map: Record<PartRequestStatus, ToneVariant> = {
    new:       "info",
    quoted:    "warning",
    accepted:  "info",
    shipped:   "warning",
    completed: "success",
    cancelled: "danger",
  };
  return map[status];
}
