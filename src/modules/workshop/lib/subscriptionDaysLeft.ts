/**
 * @file subscriptionDaysLeft.ts
 *
 * Re-exports subscription helpers from the shared lib so workshop-internal
 * imports (`../lib/subscriptionDaysLeft`) continue to work unchanged.
 * Logic lives in @shared/lib/subscriptionStatus.
 */

export {
  computeSubscriptionDaysLeft,
  subscriptionTone,
  subscriptionProgressColor,
} from "@shared/lib/subscriptionStatus";
