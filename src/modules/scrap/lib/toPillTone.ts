/**
 * @file toPillTone.ts
 *
 * Maps ToneVariant (which includes "muted") → StatusPillTone (which uses "neutral").
 * Extracted from PartRequestPreviewRow — shared with ScrapPartRequestCard.
 */

import type { StatusPillTone } from "@shared/provider-ui";
import type { ToneVariant } from "./escrowLifecycle";

/** Maps lifecycle ToneVariant to ProviderStatusPill-compatible tone. */
export function toPillTone(tone: ToneVariant): StatusPillTone {
  return tone === "muted" ? "neutral" : tone;
}
