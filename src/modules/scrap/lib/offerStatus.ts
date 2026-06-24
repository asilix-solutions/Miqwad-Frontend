/**
 * @file offerStatus.ts
 *
 * Offer-status helpers: derives semantic OfferStatus from PartRequestStatus and
 * maps it to a StatusPillTone for display in the My Offers view.
 *
 * Mapping (provider POV):
 *   new       → null      (no offer submitted — excluded from My Offers)
 *   quoted    → pending   (offer sent, awaiting buyer acceptance)
 *   accepted  → accepted  (buyer accepted the price)
 *   shipped   → accepted  (still "accepted" in the provider's offer view)
 *   completed → completed (deal done, funds released)
 *   cancelled → rejected  (offer was rejected / deal cancelled)
 */

import type { StatusPillTone } from "@shared/provider-ui";
import type { PartRequestStatus, OfferStatus } from "../types";

/** Converts a PartRequestStatus to the semantic OfferStatus (null = no offer). */
export function toOfferStatus(status: PartRequestStatus): OfferStatus | null {
  switch (status) {
    case "new":       return null;
    case "quoted":    return "pending";
    case "accepted":
    case "shipped":   return "accepted";
    case "completed": return "completed";
    case "cancelled": return "rejected";
  }
}

/** Maps a semantic OfferStatus to a ProviderStatusPill-compatible tone. */
export function offerStatusTone(status: OfferStatus): StatusPillTone {
  const map: Record<OfferStatus, StatusPillTone> = {
    pending:   "warning",
    accepted:  "info",
    completed: "success",
    rejected:  "neutral",
  };
  return map[status];
}
