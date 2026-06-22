/**
 * @file escrowLifecycle.ts
 *
 * Escrow state machine: valid transitions and UI tone helpers.
 * Single source of truth — used by mock server and UI alike.
 *
 * Dealer perspective: the scrap dealer CANNOT release escrow.
 * Escrow releases when the BUYER confirms receipt. The dealer's
 * actions are: submit offer (creates escrow) + mark shipped.
 */

import type { EscrowStatus } from "../types";

const TRANSITIONS: Record<EscrowStatus, readonly EscrowStatus[]> = {
  pending:  ["held"],
  held:     ["released", "disputed"],
  released: [],
  disputed: ["released", "refunded"],
  refunded: [],
};

/** Returns true if the escrow transition from → to is valid. */
export function canEscrowTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return (TRANSITIONS[from] as readonly string[]).includes(to);
}

/** Returns all valid next escrow statuses reachable from `from`. */
export function nextEscrowStatuses(from: EscrowStatus): EscrowStatus[] {
  return TRANSITIONS[from] as EscrowStatus[];
}

export type ToneVariant = "info" | "success" | "warning" | "danger" | "muted";

/** Maps an escrow status to a UI colour tone for pills/badges. */
export function escrowStatusTone(status: EscrowStatus): ToneVariant {
  const map: Record<EscrowStatus, ToneVariant> = {
    pending:  "muted",
    held:     "info",
    released: "success",
    disputed: "warning",
    refunded: "danger",
  };
  return map[status];
}
