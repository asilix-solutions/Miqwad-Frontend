/**
 * @file planBillingCycle.ts
 * @description Tiny presentational helper shared by the Plans views. Turns a
 * raw `billingCycle` wire int into a stable i18n key via the isolated map in
 * `types.ts` — components must never hardcode cycle labels. Unknown ints fall
 * back to the raw number so an unexpected value stays visible rather than
 * silently blank.
 */
import { BILLING_CYCLE_LABEL_KEY } from "../types";

/** i18n key for a billing-cycle int, or `null` when the int is unmapped. */
export function billingCycleLabelKey(billingCycle: number): string | null {
  const key = BILLING_CYCLE_LABEL_KEY[billingCycle];
  return key ? `superAdmin.plans.billingCycles.${key}` : null;
}
