/**
 * @file offerStatus.ts
 *
 * The SINGLE isolated switch-point for dealer offer display status.
 *
 * CONFIRMED (write-probe): `isActive` is a stored flag, always `true`; status
 * derives from the date window. The `!isActive` short-circuit below is kept as
 * a harmless guard (it can never fire on live data) so this stays the single
 * switch-point if the backend ever gives `isActive` real meaning. Every
 * component derives status ONLY through `computeOfferStatus` here, and maps it
 * to a label / pill tone ONLY through `OFFER_STATUS_META` here.
 *
 * No hardcoded labels or colours live in the offer components.
 */
import type { StatusPillTone } from "@shared/provider-ui";
import type { Offer, OfferStatus } from "./types";

/**
 * Derive the display status of an offer at a given instant.
 *
 * Logic:
 *   - `!isActive`            → "inactive"  (guard only — never fires on live data)
 *   - `now  < startDate`     → "scheduled"
 *   - `now  > endDate`       → "expired"
 *   - otherwise              → "active"
 */
export function computeOfferStatus(offer: Offer, now: Date): OfferStatus {
  if (!offer.isActive) return "inactive";

  const start = new Date(offer.startDate).getTime();
  const end = new Date(offer.endDate).getTime();
  const t = now.getTime();

  if (!Number.isNaN(start) && t < start) return "scheduled";
  if (!Number.isNaN(end) && t > end) return "expired";
  return "active";
}

/** i18n label key + pill tone for each derived status. */
export interface OfferStatusMeta {
  /** Key under `dealer.offers.status.*` in both i18n trees. */
  labelKey: string;
  tone: StatusPillTone;
}

/** The one isolated status → label/tone map. No colours in components. */
export const OFFER_STATUS_META: Record<OfferStatus, OfferStatusMeta> = {
  scheduled: { labelKey: "dealer.offers.status.scheduled", tone: "info" },
  active:    { labelKey: "dealer.offers.status.active",    tone: "success" },
  expired:   { labelKey: "dealer.offers.status.expired",   tone: "neutral" },
  inactive:  { labelKey: "dealer.offers.status.inactive",  tone: "warning" },
};
